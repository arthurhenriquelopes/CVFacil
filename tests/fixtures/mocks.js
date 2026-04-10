/**
 * Mock profiles for testing ATS analysis and CV generation.
 */

// Arthur's profile (the real test case)
export const PROFILE_FULLSTACK_JR = {
  name: 'Arthur Henrique Lopes Feitosa',
  email: 'arthurhenriquelopesf@gmail.com',
  phone: '98 99161-2062',
  location: 'São José de Ribamar, Maranhão',
  summary: 'Experiência como estagiário de desenvolvimento full stack, com domínio em criar aplicações web escaláveis e APIs RESTful robustas. Habilidoso em Spring Boot, React, Docker e PostgreSQL.',
  skills: ['Spring Boot', 'FastAPI', 'React', 'Vue.js', 'Docker', 'PostgreSQL', 'JWT', 'OCR', 'Flutter/Dart', 'APIs REST', 'Testes unitários', 'Testes de integração', 'Scrum', 'Kanban', 'Gradle', 'DBeaver', 'Autenticação e autorização', 'Criptografia', 'Segurança da informação'],
  experiences: [
    {
      title: 'Estagiário de Desenvolvimento Full Stack',
      company: 'Midas Desenvolvimento de Sistemas',
      startDate: '06/2025',
      endDate: '12/2025',
      isCurrent: false,
      description: 'Desenvolvimento de chatbot inteligente com backend Spring Boot e frontend Flutter/Dart, integrando LLM para processamento de documentos via OCR. Implementação de APIs REST, controllers e autenticação JWT com criptografia. Criação de testes unitários e de integração. Conteinerização com Docker e gestão de banco PostgreSQL. Trabalho em equipe ágil com Scrum e Kanban.',
    },
    {
      title: 'Intérprete de Inglês',
      company: 'FIRA RoboWorld Cup 2024',
      startDate: '01/2024',
      endDate: '12/2024',
      isCurrent: false,
      description: 'Atuação como intérprete em competição internacional de robótica por 7 dias. Tradução simultânea em eventos, promovendo comunicação eficiente entre participantes.',
    },
  ],
  education: [{ degree: 'Bacharelado em Sistemas de Informação', institution: 'Instituto Federal do Maranhão (IFMA)', startDate: '03/2024', endDate: '01/2027' }],
  languages: [{ name: 'Inglês', level: 'C1 Avançado' }],
  projects: [],
  certifications: [],
};

// Senior backend dev (high match expected)
export const PROFILE_SENIOR_BACKEND = {
  name: 'Maria Silva',
  email: 'maria@email.com',
  phone: '11 99999-0000',
  location: 'São Paulo, SP',
  summary: 'Engenheira de Software Sênior com 8 anos em arquitetura de microsserviços, Java/Spring Boot, AWS e liderança técnica.',
  skills: ['Java', 'Spring Boot', 'Spring MVC', 'Spring Security', 'Spring Data JPA', 'Kubernetes', 'Docker', 'AWS', 'AWS ECS', 'PostgreSQL', 'MongoDB', 'Kafka', 'RabbitMQ', 'JUnit', 'Mockito', 'CI/CD', 'GitHub Actions', 'Terraform', 'TypeScript', 'React', 'Git', 'OAuth2'],
  experiences: [
    {
      title: 'Engenheira de Software Sênior',
      company: 'Nubank',
      startDate: '01/2020',
      endDate: '',
      isCurrent: true,
      description: 'Arquitetura e desenvolvimento de microsserviços com Spring Boot e Kotlin. Deploy em Kubernetes. Mentoria de 5 devs juniores. Implementação de CI/CD com GitHub Actions.',
    },
  ],
  education: [{ degree: 'Ciência da Computação', institution: 'USP', startDate: '2012', endDate: '2016' }],
  languages: [{ name: 'Inglês', level: 'Fluente' }],
  projects: [],
  certifications: [{ name: 'AWS Solutions Architect', institution: 'Amazon' }],
};

// Designer (low match for dev jobs)
export const PROFILE_DESIGNER = {
  name: 'Lucas Oliveira',
  email: 'lucas@design.com',
  phone: '21 98888-0000',
  location: 'Rio de Janeiro, RJ',
  summary: 'Designer UX/UI com 5 anos de experiência em interfaces digitais.',
  skills: ['Figma', 'Adobe XD', 'Sketch', 'HTML', 'CSS', 'Design Systems', 'Prototipagem', 'User Research'],
  experiences: [
    {
      title: 'UX Designer',
      company: 'Agency X',
      startDate: '03/2019',
      endDate: '',
      isCurrent: true,
      description: 'Criação de protótipos e design systems para apps mobile e web.',
    },
  ],
  education: [{ degree: 'Design Digital', institution: 'PUC-Rio', startDate: '2015', endDate: '2019' }],
  languages: [{ name: 'Inglês', level: 'Intermediário' }],
  projects: [],
  certifications: [],
};

// Fintech dev job (the one we used for testing)
export const JOB_FINTECH_FULLSTACK = `Sobre a empresa:
Somos uma fintech em crescimento que desenvolve soluções de pagamento digital para o mercado brasileiro.

Responsabilidades:
- Desenvolvimento e manutenção de APIs RESTful com Spring Boot e Java 17+
- Criação de interfaces web responsivas com React e TypeScript
- Integração com serviços de terceiros (gateways de pagamento, APIs bancárias)
- Escrita de testes unitários e de integração com JUnit e Mockito
- Participação em cerimônias ágeis (Scrum) e code reviews
- Deploy e monitoramento de aplicações em containers Docker no AWS ECS
- Modelagem e gestão de banco de dados PostgreSQL
- Implementação de autenticação e autorização com OAuth2/JWT

Requisitos Obrigatórios:
- Experiência com Java e Spring Boot (Spring MVC, Spring Security, Spring Data JPA)
- Experiência com React ou Vue.js
- Conhecimento em bancos de dados relacionais (PostgreSQL)
- Familiaridade com Docker e CI/CD (GitHub Actions ou Jenkins)
- Conhecimento em versionamento com Git
- Testes automatizados (JUnit, Mockito)
- Inglês intermediário ou avançado para leitura de documentação técnica

Diferenciais:
- Experiência com mensageria (Kafka, RabbitMQ)
- Conhecimento em Kubernetes
- Experiência com microsserviços
- Graduação em Ciência da Computação, Sistemas de Informação ou áreas correlatas`;

// Data Science job (totally different domain)
export const JOB_DATA_SCIENCE = `Sobre a vaga:
Buscamos Cientista de Dados Pleno para atuar com machine learning e análise preditiva.

Requisitos Obrigatórios:
- Python avançado (NumPy, Pandas, Scikit-learn)
- Experiência com TensorFlow ou PyTorch
- SQL avançado para análise de dados
- Conhecimento em estatística e probabilidade
- Git e versionamento

Diferenciais:
- Experiência com Spark e Databricks
- Conhecimento em cloud (AWS SageMaker ou GCP Vertex AI)
- Mestrado em áreas correlatas`;

// Data Engineering job (the Rethink job that exposed bugs)
export const JOB_DATA_ENGINEERING = `Sobre a vaga
Engenheiro de Dados - Júnior

Sobre a Rethink
Somos uma consultoria que une tecnologia, design e estratégia de produtos digitais.
Empresas como Smiles, Gol, Santander Esfera, Swift e Comgás confiam em nossa parceria.

Como será seu dia a dia?
Apoiar a construção e sustentação de pipelines de dados no Databricks, utilizando notebooks, jobs e pipelines;
Garantir a entrega contínua das camadas Bronze, Silver e Gold dentro da arquitetura de dados;
Ingerir, transformar e disponibilizar dados para consumo analítico;
Criar e manter tabelas Delta e views para suporte a dashboards e análises;
Atuar com compartilhamento e consumo de dados via Delta Sharing;
Apoiar a governança de dados utilizando Unity Catalog;
Monitorar execuções de pipelines, identificar falhas e realizar troubleshooting;
Implementar e/ou apoiar validações de qualidade de dados;
Documentar pipelines, regras de negócio e a linhagem básica dos dados;

Para esta vaga, é essencial:
Conhecimento sólido de SQL (joins, agregações, CTEs, window functions e modelagem básica para analytics);
Conhecimento prático de Python para dados (manipulação, leitura/escrita e organização de código em notebooks);
Noções de Apache Spark/Databricks (DataFrames, particionamento, leitura/escrita em Delta e execução distribuída);
Experiência inicial com Databricks (uso de notebooks, jobs, clusters e boas práticas básicas);
Familiaridade com pipelines de dados e arquitetura Medallion (Bronze/Silver/Gold);
Conhecimento em Git e controle de versão (branch, PR e resolução simples de conflitos);
Capacidade de investigar problemas (logs, métricas simples, reprocessamentos);

Você pode se destacar se:
Tiver experiência com Azure Data Factory (pipelines, triggers, integrações, parâmetros, monitoramento).
Possuir conhecimento prático de Unity Catalog (permissões, data access, boas práticas de governança).
Tiver vivência com Delta Sharing (publicação/consumo e cuidados com segurança).
Possuir experiência com orquestração e automação (Databricks Workflows, CI/CD, Databricks Repos, Azure DevOps/GitHub Actions).
Tiver conhecimento em Data Quality e Observabilidade (ex.: Great Expectations/Deequ).
Possuir experiência em otimização no Databricks/Delta (partitioning, Z-ORDER, OPTIMIZE/VACUUM).
Tiver noções de modelagem dimensional e consumo por ferramentas de BI.
Possuir conhecimento de segurança e boas práticas (RBAC, segregação de ambientes).`;
