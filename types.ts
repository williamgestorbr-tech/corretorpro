
export interface PropertyData {
  tipo: string;
  cidade: string;
  bairro: string;
  preco: string;
  area: string;
  quartos: string;
  banheiros: string;
  vagas: string;
  diferenciais: string;
}

export interface AdResponse {
  olx: string;
  whatsapp: string;
  instagram: string;
  tiktok: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  creci: string;
  telefone: string;
  cidade: string;
  estado: string;
  photoUrl: string | null;
  is_active: boolean;
  subscription_status: string;
  subscription_expires_at: string | null;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  property: PropertyData;
  ads: AdResponse;
}
