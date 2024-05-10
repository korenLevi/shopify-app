import { join } from 'path';
import { readFileSync } from 'fs';
import express from 'express';
import serveStatic from 'serve-static';
import { PrismaClient } from '@prisma/client';
import shopify from './shopify.js';
import webhooks from './webhooks.js';

const prisma = new PrismaClient();
const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT, 10);
const STATIC_PATH =
	process.env.NODE_ENV === 'production'
		? `${process.cwd()}/frontend/dist`
		: `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
	shopify.config.auth.callbackPath,
	shopify.auth.callback(),
	shopify.redirectToShopifyOrAppRoot()
);
app.post(
	shopify.config.webhooks.path,
	// @ts-ignore
	shopify.processWebhooks({ webhookHandlers: webhooks })
);

// All endpoints after this point will require an active session
// app.use('/api/*', shopify.validateAuthenticatedSession());

app.use(express.json());

app.post('/api/saveCart', async (req, res) => {
	try {
		const { checkoutToken, selectedItemsIds } = req.body;

		const currSavedCart = await prisma.savedCart.findUnique({
			where: { checkoutToken: checkoutToken },
		});

		if (!currSavedCart) {
			const savedCart = await prisma.savedCart.create({
				data: {
					checkoutToken: checkoutToken,
					productsIds: selectedItemsIds,
				},
			});

			res.status(200).json({ message: 'Cart created!', cart: savedCart });
		} else {
			const savedCart = await prisma.savedCart.update({
				where: { checkoutToken: checkoutToken },
				data: {
					productsIds: selectedItemsIds,
				},
			});

			res.status(200).json({ message: 'Cart updated!', cart: savedCart });
		}

	} catch (error) {
		res.status(500).json({ message: 'error!!!', error });
	} finally {
		await prisma.$disconnect();
	}
});

app.get('/api/getSavedCart', async (req, res) => {
	try {
		const { checkoutToken } = req.query;

		const savedCart = await prisma.savedCart.findUnique({
			where: { checkoutToken: checkoutToken },
			select: {
				checkoutToken: true,
				productsIds: true,
			},
		});

		res.status(200).json({ Success: true, data: savedCart });
	} catch (error) {
		res.status(500).json({ Success: false, error });
	} finally {
		await prisma.$disconnect();
	}
});

app.use(serveStatic(STATIC_PATH, { index: false }));

// app.use('/*', shopify.ensureInstalledOnShop(), async (_req, res) => {
// 	return res.set('Content-Type', 'text/html').send(readFileSync(join(STATIC_PATH, 'index.html')));
// });

app.listen(PORT);
