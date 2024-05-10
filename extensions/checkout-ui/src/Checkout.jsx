import { useEffect, useState } from 'react';
import {
	Banner,
	useApi,
	reactExtension,
	useCartLines,
	BlockStack,
	Checkbox,
	Button,
	View,
} from '@shopify/ui-extensions-react/checkout';

export default reactExtension('purchase.checkout.block.render', () => <Extension />);

function Extension() {
	const { sessionToken, checkoutToken, extension } = useApi();
	const cart = useCartLines();
	const [selectedItemsIds, setSelectedItemsIds] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const url = new URL(extension.scriptUrl);
	const BASE_URL = `${url.protocol}//${url.host}`;

	const getSavedCart = async () => {
		const token = await sessionToken.get();
		setIsLoading(true);
		try {
			const response = await fetch(
				`${BASE_URL}/api/getSavedCart?checkoutToken=${checkoutToken.current}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
				}
			);

			resData = await response.json();
			setSelectedItemsIds(resData.data.productsIds);
		} catch (error) {
			console.log('error:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSave = async () => {
		setIsLoading(true);
		const token = await sessionToken.get();

		try {
			await fetch(`${BASE_URL}/api/saveCart`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				credentials: 'include',
				body: JSON.stringify({
					checkoutToken: checkoutToken.current,
					selectedItemsIds,
				}),
			});
		} catch (error) {
			console.log('error:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		getSavedCart();
	}, [checkoutToken]);

	return (
		<Banner title="Save your cart">
			<BlockStack>
				<View>
					{cart.map((item, index) => (
						<Checkbox
							checked={selectedItemsIds.includes(item.id)}
							onChange={(isChecked) => {
								setSelectedItemsIds((currentItems) => {
									if (isChecked) {
										return [...currentItems, item.id];
									} else {
										return currentItems.filter((id) => id !== item.id);
									}
								});
							}}
							id={item.id}
							key={index}
						>
							{item.merchandise.title}
						</Checkbox>
					))}
				</View>
				<View>
					<Button
						loading={isLoading}
						disabled={isLoading}
						onPress={() => {
							handleSave();
						}}
					>
						Save
					</Button>
				</View>
			</BlockStack>
		</Banner>
	);
}


