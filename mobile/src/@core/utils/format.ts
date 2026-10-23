import {
  ErrorResponseType,
  Genero,
  StringfiedDate,
} from '@context/types';
import { AxiosError, isAxiosError } from 'axios';

export const clearNumber = (value = '') => {
  return value.replace(/\D+/g, '');
};
export function formatDate(texto: string): string {
  const apenasNumeros = texto.replace(/\D/g, "").slice(0, 8);

  if (apenasNumeros.length <= 2) {
    return apenasNumeros;
  }

  if (apenasNumeros.length <= 4) {
    return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(2)}`;
  }

  return `${apenasNumeros.slice(0, 2)}/${apenasNumeros.slice(
    2,
    4
  )}/${apenasNumeros.slice(4, 8)}`;
}

export const onlyNumbers = (value: string, maxLength?: number) => {
  const numbers = value.replace(/\D/g, "");

  return maxLength
    ? numbers.slice(0, maxLength)
    : numbers;
};

export const onlyLetters = (value: string, maxLength?: number) => {
  const letters = value.replace(/[^\p{L}\s]/gu, "");

  return maxLength
    ? letters.slice(0, maxLength)
    : letters;
};

export const normalizeGenero = (
  genero?: string | null
): Genero | null => {
  if (
    genero === "masculino" ||
    genero === "feminino" ||
    genero === "outro"
  ) {
    return genero;
  }

  return null;
};

export const onlyLettersAndNumbers = (
  value: string,
  maxLength?: number
) => {
  const result = value.replace(/[^\p{L}\d\s]/gu, "");

  return maxLength
    ? result.slice(0, maxLength)
    : result;
};

export const dateToApi = (
  value: string | null | undefined
): string | null => {
  if (!value?.trim()) {
    return null;
  }

  const data = value.trim();

  const correspondencia = data.match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/
  );

  if (!correspondencia) {
    throw new Error(
      "Data inválida. Utilize o formato DD/MM/AAAA."
    );
  }

  const [, diaTexto, mesTexto, anoTexto] = correspondencia;

  const dia = Number(diaTexto);
  const mes = Number(mesTexto);
  const ano = Number(anoTexto);

  const dataValidacao = new Date(ano, mes - 1, dia);

  const dataValida =
    dataValidacao.getFullYear() === ano &&
    dataValidacao.getMonth() === mes - 1 &&
    dataValidacao.getDate() === dia;

  if (!dataValida) {
    throw new Error("Informe uma data existente.");
  }

  return `${anoTexto}-${mesTexto}-${diaTexto}`;
};

export const dateFromApi = (value: string | null | undefined
): string | null => {
  if (!value) return "";

  const [ano, mes, dia] = value.split("-");

  if (!ano || !mes || !dia) {
    return value;
  }

  return `${dia}/${mes}/${ano}`;
};

export const formatToIsoDate = (data: string): StringfiedDate => {
  let tempDate = data.replace(' ', 'T');
  if (!(tempDate.slice(-1).toLocaleLowerCase() == 'z')) tempDate += 'Z';

  return tempDate;
};

export function formatToValidDate(data: string): string {
  const dataValida = formatToIsoDate(data).replace('Z', '');

  return dataValida;
}

export function formatToIsoDateTime(data: Date | string): string {
  return new Date(data).toISOString();
}

export function formatCNPJ(cnpj: string): string {
  const value = clearNumber(cnpj).slice(0, 14);

  return value
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
}
const textoSeguro = (valor: unknown): string =>
  typeof valor === "string" ? valor : "";

export function formatTelefone(telefone: unknown) {
  const value = clearNumber(textoSeguro(telefone));

  return value
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4,5})(\d{4})$/, '$1-$2');
}

export function formatCpf(cpf: unknown) {
  const value = clearNumber(textoSeguro(cpf));

  return value
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function formatCnpj(cnpj: string) {
  const value = clearNumber(cnpj);

  return value
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1/$2')
    .replace(/(\d{4})(\d{2})$/, '$1-$2');
}
export function formatRg(rg: string) {
  const value = rg.replace(/[^0-9x]/gi, '').toUpperCase().slice(0, 14);

  if (value.length <= 2) return value;

  let formattedText = value.slice(0, 2);
  if (value.length > 2) formattedText += `.${value.slice(2, 5)}`;
  if (value.length > 5) formattedText += `.${value.slice(5, 8)}`;
  if (value.length === 9) formattedText += `-${value[8]}`;
  else if (value.length > 9) return value;

  return formattedText;
}
export function formatCep(cep: string): string {
  const value = clearNumber(cep).slice(0, 8);

  return value.replace(/(\d{5})(\d{3})$/, '$1-$2');
}
export function formatReal(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2).replace('.', ',')}%`;
}

export function parseReal(text: string): number {
  const clean = text
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');

  return Number.parseFloat(clean);
}
export function parsePercent(text: string): number {
  const clean = text.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(clean);
}

export const formatMoney = (value: string | number): string => {
  const numero = Number(value);

  if (!Number.isFinite(numero)) {
    return "0,00";
  }

  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatMoneyInput = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  const cents = BigInt(digits || "0");

  const inteiro = cents / 100n;
  const decimal = (cents % 100n)
    .toString()
    .padStart(2, "0");

  const inteiroFormatado = inteiro.toString().replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ".",
  );

  return `${inteiroFormatado},${decimal}`;
};
export function formatarMedida(titulo: string): string {
  const mapaFormatacao: { [key: string]: string } = {
    unidade: 'UN',
    unidades: 'UN',
    metro: 'MTS',
    metros: 'MTS',
    centimetro: 'CM',
    centimetros: 'CM',
    milimetro: 'MM',
    milimetros: 'MM',
    litro: 'LT',
    litros: 'LT',
    quilograma: 'KG',
    quilogramas: 'KG',
    grama: 'G',
    gramas: 'G',
    pacote: 'PCT',
    caixa: 'CX',
    caixas: 'CX',
  };

  const normalizado = titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  return mapaFormatacao[normalizado] || titulo.toUpperCase();
}

export function formatarCampo(valor?: string | null): string {
  return valor && valor.trim() !== '' ? valor : 'Não informado';
}

export function formatErrorMessage(
  err: AxiosError<ErrorResponseType> | unknown,
  fallback: string = 'Erro inesperado',
): string {
  if (!isAxiosError<ErrorResponseType>(err)) return fallback;

  const data = err.response?.data;

  if (!data) return fallback;

  if (data.message) return data.message;

  const firstFieldError = Object.values(data.errors ?? {})[0]?.[0];

  if (firstFieldError) return firstFieldError;

  return fallback;
}
