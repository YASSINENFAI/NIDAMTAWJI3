export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          category: string | null;
          stock: number;
          barcode: string;
          buy_price: number;
          sell_price: number;
          profit_margin: number;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      invoices: {
        Row: {
          id: string;
          customer_name: string;
          customer_vat: string | null;
          date: string;
          due_date: string;
          total: number;
          balance: number;
          status: 'مدفوعة' | 'مستحقة';
          items: Json;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>;
      };
      partners: {
        Row: {
          id: string;
          name: string;
          type: 'مورد' | 'موزع';
          phone: string | null;
          total_earned: number;
          monthly_growth: number;
          initial_letter: string;
          user_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['partners']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['partners']['Insert']>;
      };
      partner_invoices: {
        Row: {
          id: string;
          partner_id: string;
          date: string;
          products_summary: string;
          amount: number;
          status: 'مكتملة' | 'قيد المعالجة';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['partner_invoices']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['partner_invoices']['Insert']>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
