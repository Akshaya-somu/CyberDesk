import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type CreateReportRequest, type GenerateReportResponse } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useReports() {
  return useQuery({
    queryKey: [api.reports.list.path],
    queryFn: async () => {
      const res = await fetch(api.reports.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reports");
      return api.reports.list.responses[200].parse(await res.json());
    },
  });
}

export function useReport(id: number) {
  return useQuery({
    queryKey: [api.reports.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.reports.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch report");
      return api.reports.get.responses[200].parse(await res.json());
    },
    enabled: !!id && !isNaN(id),
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateReportRequest) => {
      const res = await fetch(api.reports.create.path, {
        method: api.reports.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.reports.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create report");
      }
      return api.reports.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.reports.list.path] });
      toast({
        title: "Report Saved",
        description: "Your report has been successfully saved to your dashboard.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useGenerateReport() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (description: string) => {
      const res = await fetch(api.reports.generate.path, {
        method: api.reports.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to generate report analysis");
      }
      return api.reports.generate.responses[200].parse(await res.json());
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the incident. Please try again.",
        variant: "destructive",
      });
    },
  });
}
