import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../lib/errors";

export async function getPublicQuoteHandler(req: Request, res: Response) {
  const { id } = req.params;

  const quote = await prisma.quotation.findUnique({
    where: { id },
    include: {
      enquiry: {
        include: {
          lead: true,
          branch: true,
        },
      },
      quotedBy: true,
    },
  });

  if (!quote) {
    throw new NotFoundError("Quotation not found");
  }

  res.json(quote);
}
