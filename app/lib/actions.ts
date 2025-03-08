"use server";

import connectionPool from "@/db";
import { throws } from "assert";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];
  try {
    await connectionPool.query(
      `INSERT INTO invoices (customer_id, amount, status, date)
      VALUES ($1, $2, $3, $4)
      `,
      [
        customerId, // $1
        amountInCents, // $2
        status, // $3
        date, // $4
      ]
    );
  } catch (error) {
    console.error(`Database error ${error}`);
    throw new Error("Failed to Insert the invoice");
  }
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  const amountInCents = amount * 100;

  try {
    await connectionPool.query(
      `
    UPDATE invoices
    SET customer_id = $1, amount = $2, status = $3
    WHERE id = $4`,
      [
        customerId, // $1
        amountInCents, // $2
        status, // $3
        id,
      ]
    );
  } catch (error) {
    console.error(`Database error ${error}`);
    throw new Error(`Failed to update the invoice ${id}`);
  }
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  try {
    await connectionPool.query(`DELETE FROM invoices WHERE id = $1`, [
      id, //$1
    ]);
  } catch (error) {
    console.error(`Database error ${error}`);
    throw new Error(`Failed to delete the invoice ${id}`);
  }
  revalidatePath("/dashboard/invoices");
}
