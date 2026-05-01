import client from '../client';

export interface Payment {
  id: number;
  student_name: string;
  student_admission: string;
  transaction_reference: string;
  amount: string;
  status: string;
  payment_date: string;
}

export interface StudentBalance {
  student_id: number;
  name: string;
  admission_number: string;
  expected_fees: string;
  total_paid: string;
  balance: string;
}

export const feesService = {
  getPayments: async (search?: string) => {
    const response = await client.get('fees/payments/', { params: { search } });
    return response.data;
  },

  getBalances: async () => {
    const response = await client.get('fees/payments/student_balances/');
    return response.data;
  },

  initiateMpesa: async (data: { student_id: string; amount: string; phone: string }) => {
    const response = await client.post('fees/payments/initiate_mpesa/', data);
    return response.data;
  }
};
