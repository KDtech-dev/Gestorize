export type CepAddress = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean | string;
};

export async function getCepAddress(cep: string, signal?: AbortSignal): Promise<CepAddress> {
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal });
  if (!response.ok) throw new Error('Não foi possível consultar o CEP.');
  const address = await response.json() as CepAddress;
  if (address.erro) throw new Error('CEP não encontrado.');
  return address;
}
