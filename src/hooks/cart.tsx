import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const data = await AsyncStorage.getItem('@GoMarketPlace: cart');

      if (data) {
        setProducts(JSON.parse(data));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const filteredProducts = products.filter(product => product.id !== id);
      const productToIncrement = products.find(product => product.id === id);

      if (productToIncrement) {
        productToIncrement.quantity += 1;

        setProducts([...filteredProducts, productToIncrement]);
      }

      await AsyncStorage.setItem(
        '@GoMarketPlace: cart',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const filteredProducts = products.filter(product => product.id !== id);
      const productToDecrement = products.find(product => product.id === id);
      if (productToDecrement) {
        if (productToDecrement.quantity <= 1) {
          setProducts(filteredProducts);
        } else {
          productToDecrement.quantity -= 1;
          setProducts([...filteredProducts, productToDecrement]);
        }
      }

      await AsyncStorage.setItem(
        '@GoMarketPlace: cart',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productIndex = products.findIndex(p => p.id === product.id);

      if (productIndex < 0) {
        setProducts(oldState => [...oldState, { ...product, quantity: 1 }]);
        await AsyncStorage.setItem(
          '@GoMarketPlace: cart',
          JSON.stringify([...products, { ...product, quantity: 1 }]),
        );
      } else {
        increment(product.id);
      }
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
