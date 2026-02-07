import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface JobListing {
  id: string;
  user_id: string;
  title: string;
  company: string;
  description: string;
  job_type: string;
  city: string;
  neighborhood: string | null;
  salary: string | null;
  requirements: string | null;
  whatsapp: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const JOB_TYPES = [
  { value: 'clt', label: 'CLT' },
  { value: 'pj', label: 'PJ' },
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'temporario', label: 'Temporário' },
];

export function useJobListings() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async (filters?: { job_type?: string; city?: string; search?: string }) => {
    setLoading(true);
    let query = supabase
      .from('job_listings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (filters?.job_type) query = query.eq('job_type', filters.job_type);
    if (filters?.city) query = query.ilike('city', `%${filters.city}%`);
    if (filters?.search) query = query.or(`title.ilike.%${filters.search}%,company.ilike.%${filters.search}%,description.ilike.%${filters.search}%,city.ilike.%${filters.search}%,job_type.ilike.%${filters.search}%`);

    const { data } = await query;
    if (data) setJobs(data as JobListing[]);
    setLoading(false);
  }, []);

  const fetchMyJobs = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('job_listings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return (data || []) as JobListing[];
  }, []);

  const createJob = useCallback(async (job: Omit<JobListing, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase.from('job_listings').insert(job).select().single();
    return { data, error };
  }, []);

  const updateJob = useCallback(async (id: string, updates: Partial<JobListing>) => {
    const { data, error } = await supabase.from('job_listings').update(updates).eq('id', id).select().single();
    return { data, error };
  }, []);

  const deleteJob = useCallback(async (id: string) => {
    const { error } = await supabase.from('job_listings').delete().eq('id', id);
    return { error };
  }, []);

  const getJob = useCallback(async (id: string) => {
    const { data, error } = await supabase.from('job_listings').select('*').eq('id', id).single();
    return { data: data as JobListing | null, error };
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  return { jobs, loading, fetchJobs, fetchMyJobs, createJob, updateJob, deleteJob, getJob };
}
