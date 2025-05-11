import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { UpdateDescription } from "../../../../../wailsjs/go/main/App";

interface Props {
  fileName: string;
  defaultValue: string;
}

const DEBOUNCE_MS = 60 * 1000;

export function DescriptionEditor({ fileName, defaultValue }: Props) {
  const [description, setDescription] = useState<string>(defaultValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      name,
      description,
    }: {
      name: string;
      description: string;
    }) => UpdateDescription(name, description),
    onError(err) {
      console.error("Failed to update description:", err);
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const scheduleUpdate = (newDesc: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      mutation.mutate({ name: fileName, description: newDesc });
      timerRef.current = null;
    }, DEBOUNCE_MS);
  };

  const flushUpdate = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      mutation.mutate({ name: fileName, description });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDesc = e.target.value;
    setDescription(newDesc);
    scheduleUpdate(newDesc);
  };

  const handleBlur = () => {
    flushUpdate();
  };

  return (
    <Textarea
      placeholder="Add a description for this file..."
      className="min-h-[120px] resize-none"
      value={description}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}
