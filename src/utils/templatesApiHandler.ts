import {
  TEMPLATES,
  TEMPLATE_TABS,
  AI_EDIT_LOOKS,
  type CaptionTemplateSpec,
} from '../data/templatesCatalog.ts';
import { BOLD_TEXT_PRESETS } from '../data/assetsCatalog.ts';
import { filterTemplates } from './editorLogic.ts';

export interface TemplatesApiQuery {
  id?: string;
  category?: string;
  q?: string;
  search?: string;
  type?: 'templates' | 'presets' | 'looks' | 'all';
  include?: string;
  limit?: string | number;
  offset?: string | number;
}

export interface TemplatesApiResponse {
  success: boolean;
  status: number;
  error?: string;
  meta?: {
    name: string;
    version: string;
    totalTemplates: number;
    filteredCount: number;
    availableCategories: string[];
    availableTabs: Array<{ key: string; label: string; count: number }>;
    query: TemplatesApiQuery;
    documentation: {
      endpoints: string[];
      queryParameters: Record<string, string>;
    };
  };
  data?: {
    template?: CaptionTemplateSpec;
    templates?: CaptionTemplateSpec[];
    boldTextPresets?: typeof BOLD_TEXT_PRESETS;
    aiEditLooks?: typeof AI_EDIT_LOOKS;
    tabs?: typeof TEMPLATE_TABS;
  };
  availableIds?: string[];
}

export function handleTemplatesApi(query: TemplatesApiQuery = {}): {
  status: number;
  payload: TemplatesApiResponse;
} {
  const {
    id,
    category = 'all',
    q = '',
    search = '',
    type = 'templates',
    include = '',
    limit,
    offset = 0,
  } = query;

  const searchQuery = (q || search || '').trim();
  const includesList = include
    ? include.split(',').map((s) => s.trim().toLowerCase())
    : [];

  // 1. Single template lookup by ID
  if (id) {
    const trimmedId = id.trim().toLowerCase();
    const found = TEMPLATES.find(
      (t) => t.id.toLowerCase() === trimmedId || t.name.toLowerCase() === trimmedId
    );

    if (found) {
      return {
        status: 200,
        payload: {
          success: true,
          status: 200,
          meta: {
            name: 'Captik Text Templates API',
            version: '1.0.0',
            totalTemplates: TEMPLATES.length,
            filteredCount: 1,
            availableCategories: TEMPLATE_TABS.map((t) => t.key),
            availableTabs: TEMPLATE_TABS.map((t) => ({
              key: t.key,
              label: t.label,
              count: t.ids.length,
            })),
            query,
            documentation: {
              endpoints: [
                'GET /api/templates',
                'GET /api/text-templates',
                'GET /api/templates?id=' + trimmedId,
                'GET /api/templates?category=popular',
                'GET /api/templates?category=behind',
                'GET /api/templates?q=glow',
                'GET /api/templates?type=presets',
                'GET /api/templates?type=looks',
                'GET /api/templates?type=all',
              ],
              queryParameters: {
                id: 'Unique template ID (e.g. captik_glow, ali_abdaal, mrbeast, captik_shadow, hormozi)',
                category: 'Category filter (all, popular, behind, dynamic, clean, property, spatial)',
                q: 'Search term across name, font, and description',
                type: 'Response data type (templates, presets, looks, all)',
                include: 'Comma-separated extras to include (presets, looks, tabs)',
                limit: 'Max number of templates to return',
                offset: 'Pagination starting index',
              },
            },
          },
          data: {
            template: found,
          },
        },
      };
    }

    return {
      status: 404,
      payload: {
        success: false,
        status: 404,
        error: `Template not found for id: "${id}".`,
        availableIds: TEMPLATES.map((t) => t.id),
      },
    };
  }

  // 2. Resource type = presets only
  if (type === 'presets') {
    return {
      status: 200,
      payload: {
        success: true,
        status: 200,
        meta: {
          name: 'Captik Bold Text Presets API',
          version: '1.0.0',
          totalTemplates: TEMPLATES.length,
          filteredCount: BOLD_TEXT_PRESETS.length,
          availableCategories: TEMPLATE_TABS.map((t) => t.key),
          availableTabs: TEMPLATE_TABS.map((t) => ({
            key: t.key,
            label: t.label,
            count: t.ids.length,
          })),
          query,
          documentation: {
            endpoints: [
              'GET /api/templates',
              'GET /api/text-templates',
              'GET /api/templates?type=presets',
              'GET /api/templates?type=looks',
            ],
            queryParameters: {
              type: 'Resource type: "presets"',
            },
          },
        },
        data: {
          boldTextPresets: BOLD_TEXT_PRESETS,
        },
      },
    };
  }

  // 3. Resource type = looks only
  if (type === 'looks') {
    return {
      status: 200,
      payload: {
        success: true,
        status: 200,
        meta: {
          name: 'Captik AI Edit Looks API',
          version: '1.0.0',
          totalTemplates: TEMPLATES.length,
          filteredCount: AI_EDIT_LOOKS.length,
          availableCategories: TEMPLATE_TABS.map((t) => t.key),
          availableTabs: TEMPLATE_TABS.map((t) => ({
            key: t.key,
            label: t.label,
            count: t.ids.length,
          })),
          query,
          documentation: {
            endpoints: [
              'GET /api/templates',
              'GET /api/text-templates',
              'GET /api/templates?type=presets',
              'GET /api/templates?type=looks',
            ],
            queryParameters: {
              type: 'Resource type: "looks"',
            },
          },
        },
        data: {
          aiEditLooks: AI_EDIT_LOOKS,
        },
      },
    };
  }

  // 4. Default: Filtered list of templates
  const filtered = filterTemplates(TEMPLATES, category, searchQuery);

  const parsedOffset = Math.max(0, parseInt(String(offset), 10) || 0);
  const parsedLimit = limit ? Math.max(1, parseInt(String(limit), 10)) : undefined;

  const paginatedTemplates = parsedLimit
    ? filtered.slice(parsedOffset, parsedOffset + parsedLimit)
    : filtered.slice(parsedOffset);

  const dataPayload: TemplatesApiResponse['data'] = {
    templates: paginatedTemplates,
  };

  if (type === 'all' || includesList.includes('presets')) {
    dataPayload.boldTextPresets = BOLD_TEXT_PRESETS;
  }

  if (type === 'all' || includesList.includes('looks')) {
    dataPayload.aiEditLooks = AI_EDIT_LOOKS;
  }

  if (type === 'all' || includesList.includes('tabs')) {
    dataPayload.tabs = TEMPLATE_TABS;
  }

  return {
    status: 200,
    payload: {
      success: true,
      status: 200,
      meta: {
        name: 'Captik Text Templates API',
        version: '1.0.0',
        totalTemplates: TEMPLATES.length,
        filteredCount: filtered.length,
        availableCategories: TEMPLATE_TABS.map((t) => t.key),
        availableTabs: TEMPLATE_TABS.map((t) => ({
          key: t.key,
          label: t.label,
          count: t.ids.length,
        })),
        query,
        documentation: {
          endpoints: [
            'GET /api/templates',
            'GET /api/text-templates',
            'GET /api/templates?category=popular',
            'GET /api/templates?category=behind',
            'GET /api/templates?category=dynamic',
            'GET /api/templates?id=captik_glow',
            'GET /api/templates?q=mrbeast',
            'GET /api/templates?type=presets',
            'GET /api/templates?type=looks',
            'GET /api/templates?type=all',
          ],
          queryParameters: {
            id: 'Unique template ID (e.g. captik_glow, ali_abdaal, mrbeast, captik_shadow, hormozi)',
            category: 'Category filter (all, popular, behind, dynamic, clean, property, spatial)',
            q: 'Search term across name, font, and description',
            type: 'Response data type (templates, presets, looks, all)',
            include: 'Comma-separated extras to include (presets, looks, tabs)',
            limit: 'Max number of templates to return',
            offset: 'Pagination starting index',
          },
        },
      },
      data: dataPayload,
    },
  };
}
