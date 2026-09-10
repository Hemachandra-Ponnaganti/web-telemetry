const cheerio = require('cheerio');

/**
 * Helper to determine human-readable page region from an element ancestor tree.
 */
function getPageRegion($el, $) {
  if ($el.closest('header, nav, .header, .nav, .navbar, #header, #nav').length > 0) {
    return 'Header Navigation Bar';
  }
  if ($el.closest('footer, .footer, #footer, .copyright').length > 0) {
    return 'Footer Section';
  }
  if ($el.closest('form, .form, #form, .login-box, .signup-box').length > 0) {
    return 'Form Container';
  }
  if ($el.closest('aside, .sidebar, #sidebar').length > 0) {
    return 'Sidebar Section';
  }
  if ($el.closest('main, #main, article, .hero, .banner, #content').length > 0) {
    return 'Main Content Body';
  }
  return 'Page Body';
}

/**
 * Generate a clean CSS selector path for a Cheerio element.
 */
function getCssSelector($el, $) {
  const path = [];
  let curr = $el;

  while (curr.length > 0 && curr[0].name !== 'html' && curr[0].name !== 'document') {
    const el = curr[0];
    let selector = el.name || 'div';
    
    if (el.attribs && el.attribs.id) {
      selector += `#${el.attribs.id}`;
      path.unshift(selector);
      break;
    } else if (el.attribs && el.attribs.class) {
      const classes = el.attribs.class.trim().split(/\s+/).slice(0, 2).join('.');
      if (classes) {
        selector += `.${classes}`;
      }
    }
    
    path.unshift(selector);
    curr = curr.parent();
  }

  return path.join(' > ') || 'body element';
}

function parseColor(cStr) {
  if (!cStr) return null;
  cStr = cStr.trim ? cStr.trim().toLowerCase() : cStr.toLowerCase();
  if (cStr.startsWith('#')) {
    const hex = cStr.substring(1);
    if (hex.length === 3) {
      return [parseInt(hex[0]+hex[0], 16), parseInt(hex[1]+hex[1], 16), parseInt(hex[2]+hex[2], 16)];
    } else if (hex.length >= 6) {
      return [parseInt(hex.substring(0, 2), 16), parseInt(hex.substring(2, 4), 16), parseInt(hex.substring(4, 6), 16)];
    }
  } else if (cStr.startsWith('rgb')) {
    const m = cStr.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) {
      return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
    }
  }
  const named = {
    black: [0,0,0], white: [255,255,255], red: [255,0,0], green: [0,128,0],
    blue: [0,0,255], yellow: [255,255,0], gray: [128,128,128], grey: [128,128,128]
  };
  return named[cStr] || null;
}

function relativeLuminance(rgb) {
  const [r, g, b] = rgb.map(v => {
    const s = v / 255.0;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(rgb1, rgb2) {
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Scan DOM properties for accessibility violations, low contrast layouts, 
 * missing form input label tags, empty buttons, and passed audits ("What Went Right").
 * 
 * @param {string} htmlContent - Webpage raw markup.
 * @returns {object} Accessibility and UI report payload.
 */
const analyzeUiUx = (htmlContent = '') => {
  const reports = {
    uiHealthScore: 100,
    lowContrastViolations: [],
    missingLabelsViolations: [],
    emptyButtonsViolations: [],
    passedAudits: [],
    responsivenessScore: 100,
    alerts: []
  };

  if (!htmlContent || typeof htmlContent !== 'string') {
    return { uiHealthScore: 80, alerts: [], passedAudits: [] };
  }

  const $ = cheerio.load(htmlContent);

  // 1. Document Language Check (WCAG 3.1.1)
  const htmlLang = $('html').attr('lang');
  if (htmlLang) {
    reports.passedAudits.push({
      category: "Document Language",
      title: `Language <html lang="${htmlLang}"> Correctly Declared`,
      wcag: "WCAG 3.1.1",
      location: "Root Document <html>",
      element: `<html lang="${htmlLang}">`,
      details: `Primary document language '${htmlLang}' is properly configured for screen readers.`,
      status: "passed"
    });
  } else {
    reports.uiHealthScore -= 5;
    reports.alerts.push({
      level: 'warning',
      message: 'Accessibility: <html> root element lacks a valid lang attribute.'
    });
  }

  // 2. Form Inputs, Selects, Textareas Label Audit (WCAG 3.3.2)
  const formControls = $('input, select, textarea');
  
  formControls.each((_, el) => {
    const $el = $(el);
    const tag = el.name.toLowerCase();
    const type = ($el.attr('type') || '').toLowerCase();
    if (tag === 'input' && ['hidden', 'submit', 'button', 'image'].includes(type)) {
      return;
    }

    const id = $el.attr('id');
    const name = $el.attr('name');
    const ariaLabel = $el.attr('aria-label') || $el.attr('aria-labelledby') || $el.attr('title');
    const hasParentLabel = $el.closest('label').length > 0;
    const hasForLabel = id ? $(`label[for="${id}"]`).length > 0 : false;
    const region = getPageRegion($el, $);
    const selector = getCssSelector($el, $);
    const identifier = name || id || `<${tag}>`;

    if (!ariaLabel && !hasParentLabel && !hasForLabel) {
      reports.missingLabelsViolations.push({
        element: $.html($el).substring(0, 120),
        pageRegion: region,
        cssSelector: selector,
        elementText: identifier,
        howToLocate: `Go to **${region}** $\\rightarrow$ Locate form control \`${selector}\`.`,
        message: `Interactive form <${tag}> element lacks a descriptive label, title, or matching ARIA accessibility attribute.`
      });
      reports.uiHealthScore -= 8;
      reports.alerts.push({
        level: 'warning',
        message: `Accessibility: Form <${tag}> in ${region} lacks a matching <label> or ARIA declaration.`
      });
    } else {
      const labelText = ariaLabel || (hasForLabel ? $(`label[for="${id}"]`).text().trim() : 'Parent <label>');
      reports.passedAudits.push({
        category: "Form Input Label Binding",
        title: `Form Input "${identifier}" Correctly Labeled`,
        wcag: "WCAG 3.3.2",
        location: region,
        cssSelector: selector,
        element: $.html($el).substring(0, 100),
        details: `Form field '${identifier}' in ${region} is bound to explicit label/ARIA descriptor ("${labelText.substring(0, 30)}").`,
        status: "passed"
      });
    }
  });

  // 3. Interactive Buttons Audit (WCAG 4.1.2)
  const buttons = $('button, [role="button"], a.btn, a.button');

  buttons.each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    const ariaLabel = $el.attr('aria-label') || $el.attr('title');
    const hasAltImg = $el.find('img[alt]').length > 0;
    const region = getPageRegion($el, $);
    const selector = getCssSelector($el, $);

    if (!text && !ariaLabel && !hasAltImg) {
      reports.emptyButtonsViolations.push({
        element: $.html($el).substring(0, 120),
        pageRegion: region,
        cssSelector: selector,
        elementText: "(No Text Anchor)",
        howToLocate: `Go to **${region}** $\\rightarrow$ Inspect interactive button element \`${selector}\`.`,
        message: "Button elements must contain accessible inner text, a title, or an aria-label descriptor."
      });
      reports.uiHealthScore -= 10;
      reports.alerts.push({
        level: 'warning',
        message: `Accessibility: Discovered empty interactive button in ${region} lacking ARIA description.`
      });
    } else {
      const buttonTitle = text || ariaLabel || 'Image Alt Text';
      reports.passedAudits.push({
        category: "Accessible Interactive Button",
        title: `Button "${buttonTitle.substring(0, 30)}" Correctly Anchored`,
        wcag: "WCAG 4.1.2",
        location: region,
        cssSelector: selector,
        element: $.html($el).substring(0, 100),
        details: `Interactive target in ${region} contains accessible text anchor ("${buttonTitle.substring(0, 40)}").`,
        status: "passed"
      });
    }
  });

  // 4. Color Contrast Audit (WCAG 1.4.3)
  $('[style*="color"]').each((_, el) => {
    const $el = $(el);
    const style = ($el.attr('style') || '').toLowerCase();
    
    const colorMatch = style.match(/(?:^|;\s*)color:\s*(#[a-f0-9]{3,6}|rgb[a]?\([^)]+\)|[a-z]+)/);
    const bgMatch = style.match(/background(?:-color)?:\s*(#[a-f0-9]{3,6}|rgb[a]?\([^)]+\)|[a-z]+)/);

    if (colorMatch && bgMatch) {
      const rgb1 = parseColor(colorMatch[1]);
      const rgb2 = parseColor(bgMatch[1]);
      if (rgb1 && rgb2) {
        const ratio = parseFloat(contrastRatio(rgb1, rgb2).toFixed(2));
        const region = getPageRegion($el, $);
        const selector = getCssSelector($el, $);
        const text = $el.text().trim().substring(0, 30) || 'Text element';

        if (ratio < 4.5) {
          reports.lowContrastViolations.push({
            element: $.html($el).substring(0, 120),
            pageRegion: region,
            cssSelector: selector,
            elementText: text,
            contrastRatio: ratio,
            howToLocate: `Go to **${region}** $\\rightarrow$ Look for text "${text}" inside element \`${selector}\`. Contrast ratio is ${ratio}:1 (below 4.5:1 requirement).`,
            message: `Text element "${text}" fails WCAG 2.1 contrast minimum (ratio is ${ratio}:1, required: 4.5:1).`
          });
          reports.uiHealthScore -= 12;
        } else {
          reports.passedAudits.push({
            category: "WCAG Contrast Verification",
            title: `Text "${text}" Satisfies Contrast Minimums`,
            wcag: "WCAG 1.4.3",
            location: region,
            cssSelector: selector,
            element: $.html($el).substring(0, 100),
            details: `Text "${text}" in ${region} has excellent contrast ratio of ${ratio}:1 (exceeds WCAG 4.5:1 minimum).`,
            status: "passed"
          });
        }
      }
    }
  });

  // 5. Image Alt Text Audit (WCAG 1.1.1)
  $('img').each((_, el) => {
    const $el = $(el);
    const alt = $el.attr('alt');
    const region = getPageRegion($el, $);
    const selector = getCssSelector($el, $);
    const src = ($el.attr('src') || '').split('/').pop().substring(0, 30);

    if (alt !== undefined && alt.trim() !== '') {
      reports.passedAudits.push({
        category: "Image Accessibility Alt Text",
        title: `Image "${alt.trim().substring(0, 30)}" Has Descriptive Alt Text`,
        wcag: "WCAG 1.1.1",
        location: region,
        cssSelector: selector,
        element: `<img src="${src}" alt="${alt}">`,
        details: `Image in ${region} includes descriptive alt attribute ("${alt.trim()}").`,
        status: "passed"
      });
    }
  });

  // 6. Heading Hierarchy Check (WCAG 1.3.1)
  const h1 = $('h1');
  if (h1.length > 0) {
    reports.passedAudits.push({
      category: "Heading Hierarchy",
      title: `Primary Page Heading <h1> Correctly Present`,
      wcag: "WCAG 1.3.1",
      location: "Main Page Header",
      cssSelector: getCssSelector(h1.first(), $),
      element: `<h1>${h1.first().text().trim().substring(0, 30)}</h1>`,
      details: `Main page title <h1> ("${h1.first().text().trim().substring(0, 40)}") provides clear contextual structure.`,
      status: "passed"
    });
  }

  reports.uiHealthScore = Math.max(10, reports.uiHealthScore);
  return reports;
};

module.exports = { analyzeUiUx };
