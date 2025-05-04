import { z } from "zod";

export const formSchema = z.object({
  botToken: z.string().nonempty("Please, provide telegram bot token"),
  chatId: z.string().nonempty("Please, provide telegram bot chat ID"),
  syncDirLocation: z
    .string()
    .nonempty("Please, provide sync directory location"),
});
