const axios = require('axios');

/**
 * Get analysis from OpenAI (ChatGPT) for a news article
 * @param {Object} article News article object
 * @returns {Promise<string>} Analysis text
 */
const getOpenAIAnalysis = async (article) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return mockAnalysis('OpenAI', article);
    }
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that analyzes news articles objectively. Provide a concise analysis (2-3 paragraphs) of the following news article, focusing on the implications, potential impacts, and context. Be informative and balanced in your assessment.'
          },
          {
            role: 'user',
            content: `Title: ${article.title}\n\nSummary: ${article.summary}\n\nPlease analyze this news article.`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error getting OpenAI analysis:', error.response?.data || error.message);
    return mockAnalysis('OpenAI', article);
  }
};

/**
 * Get analysis from Anthropic (Claude) for a news article
 * @param {Object} article News article object
 * @returns {Promise<string>} Analysis text
 */
const getClaudeAnalysis = async (article) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return mockAnalysis('Claude', article);
    }
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-opus-20240229',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Title: ${article.title}\n\nSummary: ${article.summary}\n\nPlease analyze this news article in 2-3 paragraphs, focusing on the implications, potential impacts, and context. Be informative and balanced in your assessment.`
          }
        ]
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.content[0].text.trim();
  } catch (error) {
    console.error('Error getting Claude analysis:', error.response?.data || error.message);
    return mockAnalysis('Claude', article);
  }
};

/**
 * Get analysis from Google (Gemini) for a news article
 * @param {Object} article News article object
 * @returns {Promise<string>} Analysis text
 */
const getGeminiAnalysis = async (article) => {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      return mockAnalysis('Gemini', article);
    }
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Analyze the following news article in 2-3 paragraphs, focusing on the implications, potential impacts, and context. Be informative and balanced in your assessment.\n\nTitle: ${article.title}\n\nSummary: ${article.summary}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      }
    );
    
    return response.data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error('Error getting Gemini analysis:', error.response?.data || error.message);
    return mockAnalysis('Gemini', article);
  }
};

/**
 * Get analysis from Microsoft (Copilot) for a news article
 * @param {Object} article News article object
 * @returns {Promise<string>} Analysis text
 */
const getCopilotAnalysis = async (article) => {
  try {
    const apiKey = process.env.MICROSOFT_API_KEY;
    
    if (!apiKey) {
      return mockAnalysis('Copilot', article);
    }
    
    // Microsoft Azure OpenAI API
    const response = await axios.post(
      'https://api.cognitive.microsoft.com/openai/deployments/gpt-4/chat/completions?api-version=2023-05-15',
      {
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that analyzes news articles objectively. Provide a concise analysis (2-3 paragraphs) of the following news article, focusing on the implications, potential impacts, and context. Be informative and balanced in your assessment.'
          },
          {
            role: 'user',
            content: `Title: ${article.title}\n\nSummary: ${article.summary}\n\nPlease analyze this news article.`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error getting Copilot analysis:', error.response?.data || error.message);
    return mockAnalysis('Copilot', article);
  }
};

/**
 * Get analysis from DeepSeek for a news article
 * @param {Object} article News article object
 * @returns {Promise<string>} Analysis text
 */
const getDeepSeekAnalysis = async (article) => {
  // DeepSeek doesn't have a public API yet, so we'll use a mock response
  return mockAnalysis('DeepSeek', article);
};

/**
 * Get analysis from Cohere for a news article
 * @param {Object} article News article object
 * @returns {Promise<string>} Analysis text
 */
const getCohereAnalysis = async (article) => {
  try {
    const apiKey = process.env.COHERE_API_KEY;
    
    if (!apiKey) {
      return mockAnalysis('Cohere', article);
    }
    
    const response = await axios.post(
      'https://api.cohere.ai/v1/generate',
      {
        model: 'command',
        prompt: `Analyze the following news article in 2-3 paragraphs, focusing on the implications, potential impacts, and context. Be informative and balanced in your assessment.\n\nTitle: ${article.title}\n\nSummary: ${article.summary}`,
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.generations[0].text.trim();
  } catch (error) {
    console.error('Error getting Cohere analysis:', error.response?.data || error.message);
    return mockAnalysis('Cohere', article);
  }
};

/**
 * Generate a mock analysis when API keys are not available
 * @param {string} aiName Name of the AI model
 * @param {Object} article News article object
 * @returns {string} Mock analysis text
 */
const mockAnalysis = (aiName, article) => {
  const category = article.category || 'general';
  
  // Different response styles based on AI model
  const responseStyles = {
    'OpenAI': {
      technology: `This development in ${article.title.toLowerCase()} represents significant progress in the tech sector. The implications for industry and society could be substantial, though we should be cautious about implementation timelines. Several technical challenges remain before widespread adoption is feasible.`,
      environment: `The ${article.title.toLowerCase()} is a positive step toward addressing climate challenges. The targets are ambitious but necessary given current environmental trends. Success will depend on sustained political will and adequate funding mechanisms.`,
      politics: `This political development regarding ${article.title.toLowerCase()} reflects the ongoing tensions in governance. While it may appear partisan at first glance, there are legitimate concerns on both sides of the debate that merit consideration.`,
      health: `The health implications of ${article.title.toLowerCase()} are significant. This could potentially improve treatment outcomes for many patients, though more research is needed to fully validate these initial findings.`,
      business: `From a business perspective, ${article.title.toLowerCase()} signals important shifts in the market. Investors should consider both short-term volatility and long-term strategic implications before making decisions based on this news.`,
      general: `The ${article.title.toLowerCase()} represents an important development that merits close attention. Various stakeholders will be affected differently, and the timeline for broader impact remains uncertain.`
    },
    'Claude': {
      technology: `The ${article.title.toLowerCase()} is noteworthy for its potential to transform multiple sectors. I'd emphasize that ethical considerations should be prioritized alongside technological advancement. The societal implications deserve careful deliberation by policymakers and industry leaders alike.`,
      environment: `The ${article.title.toLowerCase()} represents meaningful progress. I would note that implementation will require balancing environmental goals with economic considerations and social equity. Historical precedent suggests that successful environmental initiatives depend on inclusive stakeholder engagement.`,
      politics: `Regarding ${article.title.toLowerCase()}, it's important to consider the underlying institutional factors at play. Political developments rarely occur in isolation, and this case illustrates the complex interplay between public opinion, leadership decisions, and structural constraints.`,
      health: `This health development concerning ${article.title.toLowerCase()} merits careful analysis. The potential benefits should be weighed against implementation challenges and accessibility concerns. Ethical considerations around equity of access are particularly important.`,
      business: `The business implications of ${article.title.toLowerCase()} extend beyond immediate market reactions. Long-term strategic positioning, regulatory considerations, and stakeholder relationships will ultimately determine which organizations benefit most from this development.`,
      general: `When analyzing ${article.title.toLowerCase()}, I find it helpful to consider multiple perspectives. The immediate impacts may differ from long-term consequences, and various stakeholders will experience this development differently based on their positioning and resources.`
    },
    'Gemini': {
      technology: `Analyzing the ${article.title.toLowerCase()}, I see both immediate applications and longer-term implications. The technical challenges mentioned suggest a gradual rather than immediate impact. Market adoption will likely follow an S-curve, with early adopters gaining competitive advantages before mainstream implementation occurs.`,
      environment: `Analyzing the ${article.title.toLowerCase()}, I see potential for significant positive impact if fully implemented. Historical precedent suggests that monitoring mechanisms will be crucial for success. The economic case for this environmental initiative appears stronger than previous attempts, which increases likelihood of sustained commitment.`,
      politics: `My analysis of ${article.title.toLowerCase()} indicates several underlying political dynamics. Public messaging often obscures the complex negotiations occurring behind the scenes. Data suggests that public opinion on this issue is more nuanced than the polarized debate might indicate.`,
      health: `The health research described in ${article.title.toLowerCase()} builds upon previous findings in important ways. Statistical significance of these results appears robust, though real-world implementation will face different challenges than controlled research environments.`,
      business: `Market reactions to ${article.title.toLowerCase()} reflect both rational assessment and emotional responses. The quantitative data suggests moderate long-term impact, while sentiment analysis indicates stronger short-term volatility. Industry leaders should distinguish between signal and noise in their strategic responses.`,
      general: `My analysis of ${article.title.toLowerCase()} reveals several key factors worth monitoring. The initial data points to [specific implications], though confidence intervals remain wide at this early stage. Multiple scenarios remain plausible based on available information.`
    },
    'Copilot': {
      technology: `This development in ${article.title.toLowerCase()} aligns with industry trends I've observed. The economic implications could be substantial, though regulatory frameworks may need to evolve in response. Organizations should prepare for both opportunities and disruptions as this technology matures.`,
      environment: `This ${article.title.toLowerCase()} aligns with global sustainability targets. The economic implications are mixed, with short-term costs offset by long-term benefits and risk reduction. Implementation will require coordination across public and private sectors.`,
      politics: `The political development regarding ${article.title.toLowerCase()} reflects broader governance trends. Institutional constraints will shape implementation regardless of stated intentions. Public communication strategies will be crucial for building necessary coalitions.`,
      health: `From a healthcare systems perspective, ${article.title.toLowerCase()} presents both opportunities and implementation challenges. Cost-benefit analyses suggest positive overall impact, though distribution of benefits may be uneven without deliberate policy interventions.`,
      business: `This business development regarding ${article.title.toLowerCase()} has implications across multiple market segments. Competitor responses will shape ultimate outcomes as much as the initial announcement. Strategic positioning should account for both market and regulatory dynamics.`,
      general: `My assessment of ${article.title.toLowerCase()} considers both stated objectives and practical constraints. Implementation pathways will determine actual impact more than initial announcements. Stakeholders should monitor key indicators to adjust strategies as this situation evolves.`
    },
    'DeepSeek': {
      technology: `The ${article.title.toLowerCase()} presents interesting logical challenges. When analyzing the potential outcomes, I see a 68% probability of significant industry disruption within 3-5 years. The technical architecture described suggests scalability concerns that may limit initial adoption to specialized applications.`,
      environment: `The ${article.title.toLowerCase()} has a logical structure that suggests a 72% probability of achieving stated goals if funding mechanisms are properly established and maintained. Quantitative analysis of similar initiatives indicates three critical success factors that must be monitored.`,
      politics: `Logical analysis of ${article.title.toLowerCase()} reveals decision trees with multiple equilibrium states. Game theory suggests that stated positions may not reflect actual negotiation boundaries. Probability distributions favor moderate outcomes despite polarized rhetoric.`,
      health: `Statistical analysis of the health implications in ${article.title.toLowerCase()} indicates a 76% confidence interval for the reported outcomes. Bayesian inference suggests updating prior assumptions about treatment efficacy based on this new data.`,
      business: `Quantitative modeling of ${article.title.toLowerCase()} suggests market inefficiencies that create arbitrage opportunities in the short term. Logical analysis of competitive responses indicates a 64% probability of industry consolidation as a second-order effect.`,
      general: `My reasoning about ${article.title.toLowerCase()} employs probabilistic analysis of multiple causal pathways. The most likely outcome (57% probability) involves [specific prediction], though alternative scenarios remain viable and should be incorporated into contingency planning.`
    },
    'Cohere': {
      technology: `Regarding ${article.title.toLowerCase()}, several technological implications stand out. First, the innovation trajectory suggests accelerating development in adjacent fields. Second, adoption patterns will likely follow historical precedents for similar technologies, with early resistance followed by rapid integration once key thresholds are crossed.`,
      environment: `This environmental initiative described in ${article.title.toLowerCase()} represents a substantive approach to addressing specific challenges. The framework appears more robust than previous attempts, particularly in its accountability mechanisms. Implementation remains the critical variable that will determine actual impact.`,
      politics: `The political dynamics of ${article.title.toLowerCase()} reflect institutional incentives as much as individual leadership. Comparative analysis with similar situations suggests that public positioning often differs from private negotiations. Media framing will significantly influence public perception of outcomes.`,
      health: `From a public health perspective, ${article.title.toLowerCase()} represents a meaningful development. The evidence base appears stronger than for previous interventions in this domain. Implementation science suggests focusing on healthcare system integration as the critical success factor.`,
      business: `The business implications of ${article.title.toLowerCase()} extend across market segments and timeframes. Initial market reactions typically overweight short-term factors while undervaluing structural changes. Strategic responses should distinguish between cyclical and secular trends.`,
      general: `My analysis of ${article.title.toLowerCase()} examines both stated intentions and structural constraints. Historical patterns suggest that implementation will face specific challenges that can be anticipated and mitigated. Multiple stakeholder perspectives reveal different priorities that will shape ultimate outcomes.`
    }
  };
  
  // Get the appropriate response style based on AI model and article category
  const aiStyle = responseStyles[aiName] || responseStyles['OpenAI'];
  const response = aiStyle[category] || aiStyle['general'];
  
  // Add a second paragraph with more specific details
  const secondParagraph = `Looking more closely at the specifics of this news, the ${article.summary.toLowerCase()} This development occurs within a broader context of industry changes and public discourse around similar issues. Various stakeholders will likely have different perspectives on the implications.`;
  
  return `${response}\n\n${secondParagraph}`;
};

module.exports = {
  getOpenAIAnalysis,
  getClaudeAnalysis,
  getGeminiAnalysis,
  getCopilotAnalysis,
  getDeepSeekAnalysis,
  getCohereAnalysis
};
