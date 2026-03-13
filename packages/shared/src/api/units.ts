export interface UnitResponse {
  id: string;
  name: string;
  abbreviation: string | null;
}

export interface UnitListResponse {
  items: UnitResponse[];
}
