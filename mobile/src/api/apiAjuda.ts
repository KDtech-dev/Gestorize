import { getAxios } from '@configs/axios';

export const enviarContatoAjuda = async (mensagem: string) => {
  const response = await getAxios().post('/ajuda/contato', { mensagem });
  return response.data;
};
