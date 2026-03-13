export interface InstructionStepResponse {
  id: string;
  title: string | null;
  body: string;
  order: number;
}

export interface CreateStepRequest {
  title?: string;
  body: string;
}

export interface UpdateStepRequest {
  title?: string;
  body?: string;
}
