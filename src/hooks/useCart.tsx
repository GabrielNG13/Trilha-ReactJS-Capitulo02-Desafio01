import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart]
      const stock = (await api.get(`/stock/${productId}`)).data
      const stockAmount = stock.amount
      const product = newCart.find(product => product.id === productId)
      const productAmount = product ? product.amount : 0
      const newAmount = productAmount + 1
      
      if (newAmount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      if (product != null) {
        product.amount = newAmount
      } else {
        const data = (await api.get<Product>(`/products/${productId}`)).data
        
        const newProduct = {
          ...data,
          amount: 1
        }
        newCart.push(newProduct)
      }

      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart]
      const productIndex = newCart.findIndex(product => product.id === productId)
      
      if (productIndex >= 0) {
        newCart.splice(productIndex, 1)
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      } else {
        throw Error();
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return
      const newCart = [...cart]
      const productUpdated = newCart.find(product => product.id === productId)
      const productAmount = productUpdated ? productUpdated.amount : 0
      
      if (productAmount < amount) {
        const stock = (await api.get(`/stock/${productId}`)).data
        const stockAmount = stock.amount

        if (amount > stockAmount) {
          toast.error('Quantidade solicitada fora de estoque');
          return
        }
      }

      if (productUpdated) {
        productUpdated.amount = amount
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      } else {
        throw Error();
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
