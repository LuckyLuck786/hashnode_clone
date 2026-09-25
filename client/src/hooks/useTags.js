import { fetchTags } from '../api/tags.js';
import useResource from './useResource.js';

export default function useTags() {
  const { data, status, error } = useResource(fetchTags);
  return { tags: data ?? [], status, error: error?.message ?? '' };
}
