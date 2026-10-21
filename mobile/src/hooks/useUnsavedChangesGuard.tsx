import { useCallback, useRef, useState } from 'react';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import DialogConfirmarAcao from '@components/dialogs/DialogConfirmarAcao';

type Options = {
  hasUnsavedChanges: boolean;
  message: string;
};

export const useUnsavedChangesGuard = ({ hasUnsavedChanges, message }: Options) => {
  const navigation = useNavigation<any>();
  const [visible, setVisible] = useState(false);
  const blockedAction = useRef<any>(null);
  const bypassNextRemoval = useRef(false);

  usePreventRemove(hasUnsavedChanges, ({ data }) => {
    if (bypassNextRemoval.current) {
      bypassNextRemoval.current = false;
      navigation.dispatch(data.action);
      return;
    }

    blockedAction.current = data.action;
    setVisible(true);
  });

  const confirmarSaida = useCallback(() => {
    const action = blockedAction.current;
    blockedAction.current = null;
    setVisible(false);
    if (action) navigation.dispatch(action);
  }, [navigation]);

  const permitirProximaSaida = useCallback(() => {
    bypassNextRemoval.current = true;
  }, []);

  return {
    permitirProximaSaida,
    dialog: (
      <DialogConfirmarAcao
        show={visible}
        setShow={setVisible}
        titulo={message}
        onSuccess={confirmarSaida}
      />
    ),
  };
};
