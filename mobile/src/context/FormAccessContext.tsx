import React, { createContext, useContext } from 'react';

const FormAccessContext = createContext(true);

export const FormAccessProvider = ({ canEdit, children }: {
  canEdit: boolean;
  children: React.ReactNode;
}) => (
  <FormAccessContext.Provider value={canEdit}>
    {children}
  </FormAccessContext.Provider>
);

export const useFormCanEdit = () => useContext(FormAccessContext);
