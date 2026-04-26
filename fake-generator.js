/**
 * FakeGenerator — generates realistic fake data for various field types.
 * This module is injected as a content script and used by ai-client.js and content.js.
 */

const FakeGenerator = (() => {
  // ── Seed data ──────────────────────────────────────────────────────────
  const firstNames = [
    'James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia',
    'Mason', 'Isabella', 'Lucas', 'Mia', 'Alexander', 'Charlotte', 'Benjamin',
    'Amelia', 'Daniel', 'Harper', 'Henry', 'Evelyn'
  ];

  const lastNames = [
    'Anderson', 'Thompson', 'Martinez', 'Robinson', 'Clark', 'Rodriguez',
    'Lewis', 'Walker', 'Hall', 'Young', 'King', 'Wright', 'Lopez', 'Hill',
    'Scott', 'Green', 'Adams', 'Baker', 'Nelson', 'Carter'
  ];

  const streetNames = [
    'Oak Avenue', 'Maple Street', 'Cedar Lane', 'Pine Drive', 'Elm Boulevard',
    'Willow Court', 'Birch Road', 'Spruce Way', 'Ash Circle', 'Poplar Terrace'
  ];

  const cities = [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
    'San Francisco', 'Seattle', 'Denver', 'Austin', 'Portland'
  ];

  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
    'France', 'Japan', 'Netherlands', 'Sweden', 'New Zealand'
  ];

  const companyNames = [
    'Nexus Technologies', 'Pinnacle Solutions', 'Vertex Dynamics',
    'Horizon Industries', 'Catalyst Innovations', 'Summit Digital',
    'Apex Systems', 'Quantum Labs', 'Elevate Corp', 'Synergy Partners'
  ];

  const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'protonmail.com', 'icloud.com'];

  // ── Helpers ────────────────────────────────────────────────────────────
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pad = (n) => String(n).padStart(2, '0');

  // ── Generators ─────────────────────────────────────────────────────────
  const generators = {
    first_name() {
      return pick(firstNames);
    },

    last_name() {
      return pick(lastNames);
    },

    name() {
      return `${this.first_name()} ${this.last_name()}`;
    },

    email() {
      const first = this.first_name().toLowerCase();
      const last = this.last_name().toLowerCase();
      const num = randInt(1, 99);
      return `${first}.${last}${num}@${pick(domains)}`;
    },

    username() {
      const first = this.first_name().toLowerCase();
      const num = randInt(100, 9999);
      return `${first}_${num}`;
    },

    password() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
      const specials = '!@#$%&*';
      const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const digits = '0123456789';
      let pw = '';
      pw += pick([...uppers]);
      pw += pick([...digits]);
      pw += pick([...specials]);
      for (let i = 0; i < 9; i++) pw += chars[randInt(0, chars.length - 1)];
      // Shuffle
      pw = pw.split('').sort(() => Math.random() - 0.5).join('');
      return pw;
    },

    phone() {
      return `+1 (${randInt(200, 999)}) ${randInt(200, 999)}-${pad(randInt(0, 99))}${pad(randInt(0, 99))}`;
    },

    number(context) {
      // Smart number generation based on context clues
      const label = (context || '').toLowerCase();
      if (label.includes('age')) return randInt(18, 65);
      if (label.includes('salary') || label.includes('income')) return randInt(35000, 150000);
      if (label.includes('zip') || label.includes('postal')) return String(randInt(10000, 99999));
      if (label.includes('quantity') || label.includes('qty')) return randInt(1, 100);
      if (label.includes('year')) return randInt(1970, 2026);
      if (label.includes('percent') || label.includes('%')) return randInt(0, 100);
      return randInt(1, 1000);
    },

    age() {
      return randInt(18, 65);
    },

    salary() {
      return randInt(35000, 150000);
    },

    date() {
      const year = randInt(1990, 2005);
      const month = randInt(1, 12);
      const day = randInt(1, 28);
      return `${year}-${pad(month)}-${pad(day)}`;
    },

    address() {
      return `${randInt(100, 9999)} ${pick(streetNames)}`;
    },

    city() {
      return pick(cities);
    },

    country() {
      return pick(countries);
    },

    company_name() {
      return pick(companyNames);
    },

    employee_id() {
      return `EMP-${randInt(10000, 99999)}`;
    },

    textarea() {
      const sentences = [
        'This is a sample entry for testing purposes.',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        'The quick brown fox jumps over the lazy dog.',
        'Please review the attached documents for further details.',
        'Looking forward to collaborating on this project.'
      ];
      return pick(sentences) + ' ' + pick(sentences);
    },

    text(context) {
      // Fallback — try to infer a better type from context
      const label = (context || '').toLowerCase();
      if (label.includes('name') && label.includes('first')) return this.first_name();
      if (label.includes('name') && label.includes('last')) return this.last_name();
      if (label.includes('name') && label.includes('company')) return this.company_name();
      if (label.includes('name')) return this.name();
      if (label.includes('email') || label.includes('e-mail')) return this.email();
      if (label.includes('phone') || label.includes('tel') || label.includes('mobile')) return this.phone();
      if (label.includes('address') || label.includes('street')) return this.address();
      if (label.includes('city') || label.includes('town')) return this.city();
      if (label.includes('country') || label.includes('nation')) return this.country();
      if (label.includes('company') || label.includes('organization')) return this.company_name();
      if (label.includes('user')) return this.username();
      return `Sample Text ${randInt(1, 999)}`;
    },

    select(options) {
      if (options && options.length > 0) {
        // Skip placeholder-like options (empty value, "select...", "choose..." etc.)
        const validOptions = options.filter(opt => {
          const val = (opt.value || '').trim();
          const text = (opt.text || '').toLowerCase().trim();
          return val !== '' &&
                 !text.startsWith('select') &&
                 !text.startsWith('choose') &&
                 !text.startsWith('--') &&
                 !text.startsWith('please');
        });
        if (validOptions.length > 0) {
          return pick(validOptions).value;
        }
        // If all filtered out, return the last option
        return options[options.length - 1].value;
      }
      return '';
    },

    radio(options) {
      if (options && options.length > 0) {
        return pick(options).value;
      }
      return '';
    },

    checkbox() {
      return true;
    }
  };

  // ── Public API ─────────────────────────────────────────────────────────
  return {
    /**
     * Generate a fake value for the given field type.
     * @param {string}        fieldType — one of the supported types
     * @param {string}        context   — label / name for smarter generation
     * @param {Array<Object>} options   — available options for select/radio
     * @returns {string|number|boolean}
     */
    generate(fieldType, context, options) {
      const gen = generators[fieldType];
      if (!gen) return generators.text(context);

      if (fieldType === 'select' || fieldType === 'radio') {
        return gen.call(generators, options);
      }
      if (fieldType === 'number' || fieldType === 'text') {
        return gen.call(generators, context);
      }
      return gen.call(generators);
    },

    /** Expose raw generators for direct access */
    generators
  };
})();

// Make available globally for other content scripts
if (typeof window !== 'undefined') {
  window.FakeGenerator = FakeGenerator;
}
