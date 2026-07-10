export type WgerPaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type WgerTranslation = {
  language?: number | string;
  language_code?: string;
  name?: string;
  description?: string;
};

export type WgerImage = {
  id?: number;
  exercise?: number;
  exercise_uuid?: string;
  image?: string;
  is_main?: boolean;
  license_author?: string | null;
  license_object_url?: string | null;
  license_author_url?: string | null;
  license_derivative_source_url?: string | null;
};

export type WgerExerciseInfo = {
  id?: number;
  uuid?: string;
  category?: { id?: number; name?: string } | null;
  muscles?: { id?: number; name?: string; name_en?: string }[];
  equipment?: { id?: number; name?: string }[];
  images?: WgerImage[];
  translations?: WgerTranslation[];
  videos?: { video?: string; url?: string }[];
  license_author?: string | null;
};

type FetchLike = typeof fetch;

export type WgerClientOptions = {
  baseUrl?: string;
  fetcher?: FetchLike;
};

export type WgerListParams = Record<string, string | number | boolean | undefined>;

function buildUrl(baseUrl: string, endpoint: string, params: WgerListParams = {}): string {
  const url = new URL(endpoint, baseUrl);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

export function createWgerClient(options: WgerClientOptions = {}) {
  const baseUrl = options.baseUrl ?? "https://wger.de/api/v2/";
  const fetcher = options.fetcher ?? fetch;

  async function getPaginated<T>(
    endpoint: string,
    params?: WgerListParams
  ): Promise<WgerPaginatedResponse<T>> {
    const response = await fetcher(buildUrl(baseUrl, endpoint, params));

    if (!response.ok) {
      throw new Error(`wger request failed with ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<WgerPaginatedResponse<T>>;
  }

  return {
    listExerciseInfo(params?: WgerListParams) {
      const defaultParams: WgerListParams = { limit: 200 };
      return getPaginated<WgerExerciseInfo>("exerciseinfo/", { ...defaultParams, ...params });
    },
    listExerciseImages(params?: WgerListParams) {
      return getPaginated<WgerImage>("exerciseimage/", params);
    },
    listExerciseCategories(params?: WgerListParams) {
      return getPaginated<{ id: number; name: string }>("exercisecategory/", params);
    },
    listMuscles(params?: WgerListParams) {
      return getPaginated<{ id: number; name: string; name_en?: string }>("muscle/", params);
    },
    listEquipment(params?: WgerListParams) {
      return getPaginated<{ id: number; name: string }>("equipment/", params);
    },
    listVideos(params?: WgerListParams) {
      return getPaginated<{ id: number; video?: string; url?: string }>("video/", params);
    }
  };
}
