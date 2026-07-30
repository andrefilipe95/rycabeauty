import { mkdir } from "node:fs/promises";

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const base = "http://127.0.0.1:8765";
const failures = [];
const consoleErrors = [];
const emailSubmissions = [];
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH,
});
const context = await browser.newContext();
await context.addInitScript(() => {
  window.__openedUrls = [];
  window.open = (url) => {
    window.__openedUrls.push(String(url));
    return null;
  };
});
const page = await context.newPage();
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));
await page.route("https://www.google.com/**", (route) => route.abort());
await page.route("https://formsubmit.co/**", async (route) => {
  emailSubmissions.push(route.request().postDataJSON());
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ success: true, message: "Email sent" }),
  });
});

const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

await mkdir("_test_artifacts", { recursive: true });

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
]) {
  await page.setViewportSize({
    width: viewport.width,
    height: viewport.height,
  });
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const state = await page.evaluate(() => ({
    h1: document.querySelectorAll("h1").length,
    overflow:
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
    menuVisible:
      getComputedStyle(document.querySelector(".menu-toggle")).display !==
      "none",
    title: document.title,
  }));
  expect(state.h1 === 1, `${viewport.name}: deve existir um único H1`);
  expect(!state.overflow, `${viewport.name}: existe scroll horizontal`);
  expect(
    state.title.includes("Tratamentos Faciais"),
    `${viewport.name}: title inesperado`,
  );
  expect(
    viewport.width <= 900 ? state.menuVisible : !state.menuVisible,
    `${viewport.name}: estado incorreto do menu responsivo`,
  );
  const imageLocator = page.locator("img");
  const imageCount = await imageLocator.count();
  for (let index = 0; index < imageCount; index += 1) {
    await imageLocator.nth(index).scrollIntoViewIfNeeded();
  }
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 0));
  const unloadedImages = await imageLocator.evaluateAll((images) =>
    images
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.src),
  );
  expect(
    unloadedImages.length === 0,
    `${viewport.name}: imagens não carregadas: ${unloadedImages.join(", ")}`,
  );
  if (viewport.name !== "tablet") {
    await page.screenshot({
      path: `_test_artifacts/${viewport.name}.png`,
      fullPage: true,
    });
  }
}

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Abrir menu" }).click();
expect(
  (await page
    .getByRole("button", { name: "Fechar menu" })
    .getAttribute("aria-expanded")) === "true",
  "menu móvel: aria-expanded não mudou para true",
);
expect(
  await page.locator("#main-nav").isVisible(),
  "menu móvel: navegação não ficou visível",
);
expect(
  (await page
    .locator(".menu-toggle")
    .evaluate((element) => getComputedStyle(element).borderTopWidth)) === "0px",
  "menu móvel: o círculo à volta do ícone ainda está visível",
);

expect(
  (await page.locator(".concern-card[href]").count()) === 0,
  "preocupações: a caixa inteira não deve ser uma ligação",
);
expect(
  (await page.locator(".concern-card .text-link").count()) === 6,
  "preocupações: cada caixa deve ter uma ligação Saber mais",
);

expect(
  (await page.locator(".map-shell iframe").count()) === 1,
  "mapa: localização não foi carregada automaticamente",
);
const mapSource = await page.locator(".map-shell iframe").getAttribute("src");
expect(
  mapSource?.includes("Av.%20Movimento%20das%20For%C3%A7as%20Armadas%201"),
  "mapa: morada exata não foi carregada",
);
expect(
  !/maps\/dir|destination=/.test(mapSource || ""),
  "mapa: não deve abrir em modo de trajeto",
);

const comparison = page.locator("[data-before-after]");
await comparison.scrollIntoViewIfNeeded();
expect(
  (await comparison.count()) === 3,
  "comparador: devem existir três exemplos",
);
await page.locator("[data-before-after-range]").first().fill("72");
expect(
  (await comparison.first().getAttribute("data-position")) === "72%",
  "comparador: posição não acompanhou o controlo",
);

expect(
  (await page
    .locator('a[href="https://www.facebook.com/ryca.beautyy"]')
    .count()) === 2,
  "redes sociais: Facebook deve aparecer na galeria e no rodapé",
);
expect(
  (await page.locator(".social-links--footer .social-link").count()) === 3,
  "rodapé: devem existir os ícones de Facebook, Instagram e WhatsApp",
);
expect(
  !/dermatolog/i.test(await page.locator("body").innerText()),
  "conteúdo: ainda existe uma referência a dermatologia",
);

const whatsappPosition = await page
  .locator(".whatsapp-float")
  .evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return window.innerWidth - rect.right;
  });
expect(
  whatsappPosition <= 40,
  "WhatsApp: botão não está no canto inferior direito",
);

await page.locator("[data-gallery-image]").first().click();
expect(
  (await page
    .locator("[data-gallery-lightbox]")
    .getAttribute("aria-hidden")) === "false",
  "galeria: imagem não abriu",
);
await page.getByRole("button", { name: "Fechar imagem" }).click();
expect(
  (await page
    .locator("[data-gallery-lightbox]")
    .getAttribute("aria-hidden")) === "true",
  "galeria: imagem não fechou",
);

await page.getByLabel("Nome *").fill("Teste Local");
await page.getByLabel("WhatsApp ou telefone *").fill("+351 900 000 000");
await page.getByLabel("Email *").fill("teste@example.com");
await page
  .getByLabel("Tratamento ou preocupação *")
  .selectOption({ label: "Limpeza de Pele Profunda" });
await page.getByLabel("Mensagem *").fill("Mensagem de teste sem envio.");
await page.locator("#privacy").check();
await page.getByRole("button", { name: "Continuar" }).click();
const opened = await page.evaluate(() => window.__openedUrls);
expect(
  opened.length === 1 &&
    opened[0].startsWith("https://wa.me/351936932193?text="),
  "formulário: URL WhatsApp inválido",
);
expect(
  decodeURIComponent(opened[0] || "").includes("Mensagem de teste sem envio."),
  "formulário: mensagem WhatsApp não codificada corretamente",
);

await page.getByLabel("Email", { exact: true }).check();
await page.getByRole("button", { name: "Enviar pedido" }).click();
await page.waitForFunction(() =>
  document
    .querySelector("#form-status")
    ?.textContent.includes("enviado com sucesso"),
);
expect(
  (await page.locator("#form-status").innerText()).includes(
    "enviado com sucesso",
  ),
  "formulário: modo email não confirmou o envio",
);
expect(
  emailSubmissions.length === 1,
  "formulário: o pedido por email não foi enviado",
);
expect(
  emailSubmissions[0]?.email === "teste@example.com",
  "formulário: email submetido incorretamente",
);

await page.goto(`${base}/tratamentos/limpeza-de-pele-seixal/`, {
  waitUntil: "networkidle",
});
expect(
  (await page.locator("h1").count()) === 1,
  "tratamento: deve existir um único H1",
);
const schemas = await page
  .locator('script[type="application/ld+json"]')
  .allTextContents();
for (const schema of schemas) {
  try {
    JSON.parse(schema);
  } catch {
    failures.push("tratamento: JSON-LD inválido");
  }
}

expect(
  consoleErrors.length === 0,
  `erros de consola: ${consoleErrors.join(" | ")}`,
);
await browser.close();

if (failures.length) {
  console.error(failures.map((item) => `ERRO: ${item}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    "Browser QA concluído: mobile, tablet, desktop, menu, mapa, WhatsApp, email e página de tratamento.",
  );
}
