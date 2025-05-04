import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema } from "../../libs/schema";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FolderOpen, Loader } from "lucide-react";
import { MouseEventHandler, useEffect, useState } from "react";
import {
  GetConfig,
  SelectDirectory,
  UpdateConfig,
} from "../../../../../wailsjs/go/main/App";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface Props {
  onSuccess: () => void;
}

export function SettingsForm({ onSuccess }: Props) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: GetConfig,
  });

  const { mutateAsync: update } = useMutation({
    mutationFn: UpdateConfig,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (!data) return;

    form.setValue("botToken", data.bot_token);
    form.setValue("chatId", data.chat_id);
    form.setValue("syncDirLocation", data.sync_folder);
  }, [data, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    update({
      bot_token: values.botToken,
      chat_id: values.chatId,
      sync_folder: values.syncDirLocation,
    })
      .then(() => {
        toast.success("Settings were saved.", { closeButton: true });
        queryClient.invalidateQueries({ queryKey: ["settings"] });
        onSuccess();
      })
      .catch((e) => toast.error(e, { closeButton: true }));
  };

  const handleBrowseFolder: MouseEventHandler = () => {
    SelectDirectory().then((dir) => {
      form.setValue("syncDirLocation", dir, { shouldValidate: true });
    });
  };

  return isLoading ? (
    <Loader />
  ) : (
    <Form {...form}>
      <form
        id="settings-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="botToken"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Token</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your API token"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Your API token is used to authenticate with the tstore service.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Separator />
        <FormField
          control={form.control}
          name="chatId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chat ID</FormLabel>
              <FormControl>
                <Input placeholder="Enter your chat ID" {...field} />
              </FormControl>
              <FormDescription>
                The chat ID is used for accessing storage.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Separator />
        <FormField
          control={form.control}
          name="syncDirLocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sync Folder Location</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input placeholder="Select sync folder location" {...field} />
                </FormControl>
                <Button variant="outline" onClick={handleBrowseFolder}>
                  <FolderOpen />
                  Browse
                </Button>
              </div>
              <FormDescription>
                Files in this folder will be automatically synced with tstore.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
