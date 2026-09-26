import { useQuery } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';

import { keys } from '@/api/keys';
import { api } from '@/api/v1';

/** The app config (policies, company, payment methods) — rarely changes. */
export function useConfig() {
  return useQuery({ queryKey: keys.config, queryFn: api.config, staleTime: 60 * 60 * 1000 });
}

/** Open a page of the website (e.g. a policy) in the in-app browser. */
export function openSitePage(siteUrl: string, path: string) {
  return WebBrowser.openBrowserAsync(`${siteUrl}${path}`);
}
