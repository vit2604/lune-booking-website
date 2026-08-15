const DEFAULT_PROFILE = Object.freeze({
  brandName: 'Lune Boutique Apartment',
  address: '92–94 Thạch Lam, An Hải, Đà Nẵng',
  hotline: '0867 802 229',
  website: 'https://luneboutiquedanang.com',
});

export class LLMProvider {
  async generateCaption() { throw new Error('Abstract LLMProvider method'); }
  async health() { return { available: false }; }
}

export class DeterministicTemplateProvider extends LLMProvider {
  async generateCaption({ idea, profile = DEFAULT_PROFILE }) {
    const subject = idea?.keyMessage || idea?.title || 'một khoảnh khắc thư thái tại Đà Nẵng';
    const ctaVi = `Liên hệ ${profile.hotline} hoặc xem thêm tại ${profile.website}.`;
    const ctaEn = `Contact ${profile.hotline} or visit ${profile.website}.`;
    return {
      primary_language: 'vi', secondary_language: 'en',
      headline: idea?.title || 'Một ngày nhẹ nhàng cùng Lune',
      caption_vi: `${subject}. Lune Boutique Apartment chào đón bạn tại ${profile.address}. ${ctaVi}`,
      caption_en: `${subject}. ${profile.brandName} welcomes you at ${profile.address}. ${ctaEn}`,
      caption_ko_optional: null,
      short_caption: `${idea?.title || 'Lune Đà Nẵng'} — ${ctaVi}`,
      cta: ctaVi,
      hashtags: ['#LuneBoutiqueApartment', '#DaNang'],
      alt_text: idea?.title || 'Không gian thật tại Lune Boutique Apartment',
      facts_used: [profile.brandName, profile.address, profile.hotline, profile.website],
      source_ids: [], risk_flags: [], confidence: 0.82,
      recommended_publish_time: idea?.recommendedPublishAt ? new Date(idea.recommendedPublishAt).toISOString() : null,
      provider: 'deterministic-template',
    };
  }

  async health() { return { available: true, provider: 'deterministic-template', costVnd: 0 }; }
}

export class OllamaLLMProvider extends LLMProvider {
  constructor({ baseUrl = 'http://127.0.0.1:11434', model, timeoutMs = 45_000 } = {}) {
    super();
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
    this.timeoutMs = timeoutMs;
  }

  async health() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(2_000) });
      return { available: response.ok, provider: 'ollama', model: this.model || null, costVnd: 0 };
    } catch { return { available: false, provider: 'ollama', model: this.model || null, costVnd: 0 }; }
  }

  async generateCaption(context) {
    if (!this.model) throw new Error('OLLAMA_MODEL is not configured');
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, signal: AbortSignal.timeout(this.timeoutMs),
      body: JSON.stringify({
        model: this.model, stream: false, format: 'json',
        prompt: `Return only JSON for a truthful Vietnamese-English hotel social caption. Never invent facts. Context:\n${JSON.stringify(context)}`,
        options: { temperature: 0.2 },
      }),
    });
    if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}`);
    const payload = await response.json();
    return { ...JSON.parse(payload.response), provider: 'ollama' };
  }
}

export class FallbackLLMProvider extends LLMProvider {
  constructor(providers) { super(); this.providers = providers; }
  async generateCaption(context) {
    const errors = [];
    for (const provider of this.providers) {
      try { return await provider.generateCaption(context); } catch (error) { errors.push(error.message); }
    }
    throw new AggregateError(errors.map((message) => new Error(message)), 'Every LLM provider failed');
  }
}
