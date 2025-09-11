// Data integrity and migration utilities for PostgreSQL preparation

export interface DataMigrationConfig {
  version: string;
  description: string;
  validate: (data: any) => boolean;
  migrate: (data: any) => any;
}

/**
 * Validates user data structure
 */
export const validateUserData = (user: any): boolean => {
  const required = ['id', 'name', 'username', 'password', 'role'];
  return required.every(field => user && typeof user[field] === 'string' && user[field].trim() !== '');
};

/**
 * Validates news article data structure
 */
export const validateArticleData = (article: any): boolean => {
  const required = ['id', 'title', 'content', 'category', 'createdAt'];
  return required.every(field => 
    article && 
    typeof article[field] === 'string' && 
    article[field].trim() !== ''
  );
};

/**
 * Validates banner data structure
 */
export const validateBannerData = (banner: any): boolean => {
  const required = ['id', 'name', 'gifUrl', 'position'];
  return required.every(field => 
    banner && 
    typeof banner[field] === 'string' && 
    banner[field].trim() !== ''
  ) && typeof banner.isActive === 'boolean';
};

/**
 * Validates program data structure
 */
export const validateProgramData = (program: any): boolean => {
  const required = ['id', 'title', 'host', 'startTime', 'endTime'];
  return required.every(field => 
    program && 
    typeof program[field] === 'string' && 
    program[field].trim() !== ''
  ) && typeof program.isActive === 'boolean';
};

/**
 * Cleans and validates all localStorage data
 */
export const validateAllLocalStorageData = (): {
  isValid: boolean;
  issues: string[];
  stats: {
    users: number;
    articles: number;
    banners: number;
    programs: number;
  };
} => {
  const issues: string[] = [];
  let userCount = 0;
  let articleCount = 0;
  let bannerCount = 0;
  let programCount = 0;

  try {
    // Validate users
    const usersData = localStorage.getItem('users_store');
    if (usersData) {
      const users = JSON.parse(usersData);
      if (Array.isArray(users)) {
        userCount = users.length;
        users.forEach((user, index) => {
          if (!validateUserData(user)) {
            issues.push(`Invalid user data at index ${index}: ${user?.name || 'Unknown'}`);
          }
        });
      } else {
        issues.push('Users data is not an array');
      }
    }

    // Validate articles
    const articlesData = localStorage.getItem('news_articles');
    if (articlesData) {
      const articles = JSON.parse(articlesData);
      if (Array.isArray(articles)) {
        articleCount = articles.length;
        articles.forEach((article, index) => {
          if (!validateArticleData(article)) {
            issues.push(`Invalid article data at index ${index}: ${article?.title || 'Unknown'}`);
          }
        });
      } else {
        issues.push('Articles data is not an array');
      }
    }

    // Validate banners
    const bannersData = localStorage.getItem('banners_store');
    if (bannersData) {
      const banners = JSON.parse(bannersData);
      if (Array.isArray(banners)) {
        bannerCount = banners.length;
        banners.forEach((banner, index) => {
          if (!validateBannerData(banner)) {
            issues.push(`Invalid banner data at index ${index}: ${banner?.name || 'Unknown'}`);
          }
        });
      } else {
        issues.push('Banners data is not an array');
      }
    }

    // Validate programs
    const programsData = localStorage.getItem('programs_store');
    if (programsData) {
      const programs = JSON.parse(programsData);
      if (Array.isArray(programs)) {
        programCount = programs.length;
        programs.forEach((program, index) => {
          if (!validateProgramData(program)) {
            issues.push(`Invalid program data at index ${index}: ${program?.title || 'Unknown'}`);
          }
        });
      } else {
        issues.push('Programs data is not an array');
      }
    }
  } catch (error) {
    issues.push(`JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    isValid: issues.length === 0,
    issues,
    stats: {
      users: userCount,
      articles: articleCount,
      banners: bannerCount,
      programs: programCount
    }
  };
};

/**
 * Generates SQL insert statements for current localStorage data (PostgreSQL ready)
 */
export const generateMigrationSQL = (): string => {
  const validation = validateAllLocalStorageData();
  
  if (!validation.isValid) {
    throw new Error(`Data validation failed: ${validation.issues.join(', ')}`);
  }

  const sqlStatements: string[] = [];
  
  try {
    // Generate user inserts
    const usersData = localStorage.getItem('users_store');
    if (usersData) {
      const users = JSON.parse(usersData);
      users.forEach((user: any) => {
        if (validateUserData(user)) {
          sqlStatements.push(
            `INSERT INTO users (id, name, username, password_hash, role, created_at, updated_at) VALUES ('${user.id}', '${user.name}', '${user.username}', '$2b$10$encrypted_hash_here', '${user.role}', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;`
          );
          
          if (user.role === 'colunista' && user.columnistProfile) {
            const profile = user.columnistProfile;
            sqlStatements.push(
              `INSERT INTO columnist_profiles (id, user_id, name, avatar, bio, specialty, allowed_categories, created_at, updated_at) VALUES ('${profile.id}', '${user.id}', '${profile.name}', '${profile.avatar}', '${profile.bio}', '${profile.specialty}', ARRAY['${profile.allowedCategories.join("', '")}'], NOW(), NOW()) ON CONFLICT (id) DO NOTHING;`
            );
          }
        }
      });
    }

    // Generate article inserts
    const articlesData = localStorage.getItem('news_articles');
    if (articlesData) {
      const articles = JSON.parse(articlesData);
      articles.forEach((article: any) => {
        if (validateArticleData(article)) {
          const columnistId = article.columnist?.id || 'NULL';
          sqlStatements.push(
            `INSERT INTO news_articles (id, title, content, excerpt, category, featured_image, views, comments, featured, is_draft, is_column_copy, original_article_id, columnist_id, created_at, updated_at) VALUES ('${article.id}', '${article.title.replace(/'/g, "''")}', '${article.content.replace(/'/g, "''")}', '${article.excerpt?.replace(/'/g, "''") || ''}', '${article.category}', '${article.featuredImage}', ${article.views || 0}, ${article.comments || 0}, ${article.featured || false}, ${article.isDraft || false}, ${article.isColumnCopy || false}, ${article.originalArticleId ? `'${article.originalArticleId}'` : 'NULL'}, ${columnistId === 'NULL' ? 'NULL' : `'${columnistId}'`}, '${article.createdAt}', '${article.updatedAt}') ON CONFLICT (id) DO NOTHING;`
          );
        }
      });
    }

    // Generate program inserts
    const programsData = localStorage.getItem('programs_store');
    if (programsData) {
      const programs = JSON.parse(programsData);
      programs.forEach((program: any) => {
        if (validateProgramData(program)) {
          sqlStatements.push(
            `INSERT INTO radio_programs (id, title, host, start_time, end_time, description, status, is_active, created_at, updated_at) VALUES ('${program.id}', '${program.title}', '${program.host}', '${program.startTime}', '${program.endTime}', '${program.description || ''}', '${program.status}', ${program.isActive}, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;`
          );
        }
      });
    }

    // Generate banner inserts
    const bannersData = localStorage.getItem('banners_store');
    if (bannersData) {
      const banners = JSON.parse(bannersData);
      banners.forEach((banner: any) => {
        if (validateBannerData(banner)) {
          sqlStatements.push(
            `INSERT INTO banners (id, name, gif_url, position, category, is_active, click_url, created_at, updated_at) VALUES ('${banner.id}', '${banner.name}', '${banner.gifUrl}', '${banner.position}', ${banner.category ? `'${banner.category}'` : 'NULL'}, ${banner.isActive}, '${banner.clickUrl || ''}', '${banner.createdAt}', '${banner.updatedAt}') ON CONFLICT (id) DO NOTHING;`
          );
        }
      });
    }

  } catch (error) {
    throw new Error(`SQL generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return sqlStatements.join('\n');
};

/**
 * Exports all data in a format ready for PostgreSQL import
 */
export const exportDataForMigration = () => {
  const validation = validateAllLocalStorageData();
  
  return {
    validation,
    sql: validation.isValid ? generateMigrationSQL() : '',
    timestamp: new Date().toISOString(),
    stats: validation.stats
  };
};