import React, { createContext, useReducer } from 'react';

const initialState = {
  menuOrder: [],
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM':
      return { ...state, menuOrder: [...state.menuOrder, action.payload] };
    case 'UPDATE_ITEM':
      return {
        ...state,
        menuOrder: state.menuOrder.map((item) => item.id === action.payload.id ? action.payload : item),
      };
    case 'DELETE_ITEM':
      return {
        ...state,
        menuOrder: state.menuOrder.filter((item) => item.id !== action.payload.id),
      };
    default:
      return state;
  }
};

const MenuOrderContext = createContext();

const MenuOrderProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <MenuOrderContext.Provider value={{ state, dispatch }}>
      {children}
    </MenuOrderContext.Provider>
  );
};

export { MenuOrderContext, MenuOrderProvider };
