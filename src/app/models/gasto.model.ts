export interface Gasto {
  id: string;
  concepto: string;
  monto: number;
  fecha: Date;
  categoria: CategoriaGasto;
  metodoPago: MetodoPago;
  notas?: string;
  imagenTicket?: string;
  creadoPorIA?: boolean;
}

export type CategoriaGasto = 'comida' | 'transporte' | 'servicios' | 'salud' | 'otros';

export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia';

export interface CategoriaInfo {
  id: CategoriaGasto;
  nombre: string;
  icono: string;
  color: string;
}

export const CATEGORIAS: CategoriaInfo[] = [
  { id: 'comida', nombre: 'Comida', icono: 'restaurant', color: '#F59E0B' },
  { id: 'transporte', nombre: 'Transporte', icono: 'car', color: '#3B82F6' },
  { id: 'servicios', nombre: 'Servicios', icono: 'flash', color: '#EF4444' },
  { id: 'salud', nombre: 'Salud', icono: 'medkit', color: '#10B981' },
  { id: 'otros', nombre: 'Otros', icono: 'ellipsis-horizontal', color: '#8B5CF6' },
];

export interface ResumenCategoria {
  categoria: CategoriaInfo;
  total: number;
  porcentaje: number;
}

export interface DatosEscaneados {
  concepto?: string;
  monto?: number;
  fecha?: Date;
  categoria?: CategoriaGasto;
  imagenTicket?: string;
}
