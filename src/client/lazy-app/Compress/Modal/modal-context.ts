import { Context, createContext } from 'preact';
import { ModalMessage } from '.';

export type ModalContextType = (_: ModalMessage) => void;

const ModalContext: Context<ModalContextType> = createContext(
  (modalMessage) => {
    // Will be shown only if there is no ModalContext Provider
    console.log('Using default context');
  },
);

export default ModalContext;
