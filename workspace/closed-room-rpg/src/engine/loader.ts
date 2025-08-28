import type { Story } from './types';

export async function loadStoryFromUrl(url: string): Promise<Story> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load story: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as Story;
  return data;
}

