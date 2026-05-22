export interface Motorcycle {
    id: string;
    brand: string;
    model: string;
    year: number;
    mileage: number;
    city: string;
    base_price: number;
    description: string;
    image_url: string;
    plate: string;
    verified: boolean;
    created_at?: string;  // Opcional, porque se genera automáticamente
    user_id?: string;     // Opcional, para saber quién la publicó
}