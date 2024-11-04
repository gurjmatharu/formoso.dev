// dashboard/hooks/useFormSubmissions.ts

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FormSubmission } from "../types";

export const useFormSubmissions = () => {
  const [data, setData] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: fetchedData, error } = await supabase
          .from("form_submissions")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        const parsedData = (fetchedData || []).map((item) => ({
          ...item,
          form_data: item.form_data ? JSON.parse(item.form_data) : {},
        }));

        if (isMounted) {
          setData(parsedData as FormSubmission[]);
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to fetch data");
          console.error("Error fetching data:", err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, loading, error, setData };
};
