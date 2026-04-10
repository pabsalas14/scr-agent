/**
 * Search Service - Global search across all resources
 */

import { apiClient } from './api.service';

export interface SearchQuery {
  query: string;
  page?: number;
  limit?: number;
  filters?: {
    type?: string;
    severity?: string;
    status?: string;
  };
}

export interface SearchResult {
  id: string;
  title: string;
  type: 'project' | 'finding' | 'report' | 'incident' | 'analysis';
  description?: string;
  relevance: number;
  href?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
}

class SearchService {
  /**
   * Global search across all resources
   */
  async search(query: SearchQuery): Promise<SearchResponse> {
    try {
      const params = new URLSearchParams();
      params.append('q', query.query);
      params.append('page', (query.page || 1).toString());
      params.append('limit', (query.limit || 10).toString());

      // Add filters to query parameters
      if (query.filters?.type) {
        params.append('type', query.filters.type);
      }
      if (query.filters?.severity) {
        params.append('severity', query.filters.severity);
      }
      if (query.filters?.status) {
        params.append('status', query.filters.status);
      }

      const response = await apiClient.get<SearchResponse>(`/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSuggestions(query: string): Promise<string[]> {
    try {
      const response = await apiClient.get<{ suggestions: string[] }>(
        `/search/suggestions?q=${encodeURIComponent(query)}`
      );
      return response.data.suggestions;
    } catch (error) {
      console.error('Search suggestions error:', error);
      return [];
    }
  }

  /**
   * Save a search filter for reuse
   */
  async saveFilter(name: string, filters: any): Promise<{ id: string }> {
    try {
      const response = await apiClient.post<{ id: string }>('/search/filters/save', {
        name,
        filters,
      });
      return response.data;
    } catch (error) {
      console.error('Save filter error:', error);
      throw error;
    }
  }

  /**
   * Get saved search filters
   */
  async getSavedFilters(): Promise<Array<{ id: string; name: string; filters: any }>> {
    try {
      const response = await apiClient.get<Array<{ id: string; name: string; filters: any }>>(
        '/search/filters/saved'
      );
      return response.data;
    } catch (error) {
      console.error('Get saved filters error:', error);
      return [];
    }
  }
}

export const searchService = new SearchService();
