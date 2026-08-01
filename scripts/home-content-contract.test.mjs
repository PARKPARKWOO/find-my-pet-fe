import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import ts from "typescript";

import { loadTypeScriptModule } from "./test-utils/load-typescript-module.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const content = loadTypeScriptModule(path.join(rootDir, "src/lib/featuredGuides.ts"));
const searchBar = fs.readFileSync(
  path.join(rootDir, "src/app/_components/layout/SearchBar.tsx"),
  "utf8",
);
const homeFeed = fs.readFileSync(
  path.join(rootDir, "src/app/_components/home/HomeFeed.client.tsx"),
  "utf8",
);
const readOwnedSource = (relativePath) => {
  const file = path.join(rootDir, relativePath);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
};
const page = readOwnedSource("src/app/page.tsx");
const categoryNav = readOwnedSource(
  "src/app/_components/category/PurposeCategoryNav.tsx",
);
const hero = readOwnedSource("src/app/_components/home/HomeHero.tsx");
const guide = readOwnedSource("src/app/_components/home/SituationGuide.tsx");
const nearby = readOwnedSource("src/app/_components/home/NearbyDiscovery.tsx");
const nearbyMap = readOwnedSource(
  "src/app/_components/home/HomeNearbyMap.client.tsx",
);
const marquee = readOwnedSource("src/components/patterns/MarqueeRail.client.tsx");
const latestMarquee = readOwnedSource("src/app/_components/home/LatestPetMarquee.tsx");
const kakaoScript = readOwnedSource("src/app/_components/KakaoMapScript.tsx");

function parseTsx(source, fileName = "contract.tsx") {
  return ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
}

function walk(node, visit) {
  visit(node);
  node.forEachChild((child) => walk(child, visit));
}

function jsxAttribute(element, name) {
  return element.openingElement.attributes.properties.find(
    (attribute) => ts.isJsxAttribute(attribute) && attribute.name.text === name,
  );
}

function jsxStringAttribute(element, name) {
  const attribute = jsxAttribute(element, name);
  return attribute?.initializer && ts.isStringLiteral(attribute.initializer)
    ? attribute.initializer.text
    : null;
}

function constantTruthiness(expression) {
  if (ts.isParenthesizedExpression(expression)) {
    return constantTruthiness(expression.expression);
  }
  if (expression.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (expression.kind === ts.SyntaxKind.FalseKeyword || expression.kind === ts.SyntaxKind.NullKeyword) {
    return false;
  }
  if (ts.isStringLiteral(expression) || ts.isNumericLiteral(expression)) {
    return Boolean(expression.text && Number(expression.text) !== 0) ||
      (ts.isStringLiteral(expression) && expression.text.length > 0);
  }
  if (
    ts.isPrefixUnaryExpression(expression) &&
    expression.operator === ts.SyntaxKind.ExclamationToken
  ) {
    const operand = constantTruthiness(expression.operand);
    return operand === null ? null : !operand;
  }
  return null;
}

function statementAlwaysAbrupt(statement) {
  if (ts.isReturnStatement(statement) || ts.isThrowStatement(statement)) return true;
  if (ts.isBlock(statement)) return statement.statements.some(statementAlwaysAbrupt);
  if (!ts.isIfStatement(statement)) return false;

  const condition = constantTruthiness(statement.expression);
  if (condition === true) return statementAlwaysAbrupt(statement.thenStatement);
  if (condition === false) {
    return Boolean(statement.elseStatement && statementAlwaysAbrupt(statement.elseStatement));
  }
  return Boolean(
    statement.elseStatement &&
      statementAlwaysAbrupt(statement.thenStatement) &&
      statementAlwaysAbrupt(statement.elseStatement),
  );
}

function assertExplicitNearbyButtonContract(source) {
  const sourceFile = parseTsx(source, "HomeNearbyMap.client.tsx");
  const handlers = [];
  const geolocationCalls = [];
  const lookupButtons = [];

  walk(sourceFile, (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "handleLookup" &&
      node.initializer &&
      ts.isArrowFunction(node.initializer)
    ) {
      handlers.push(node.initializer);
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.getText(sourceFile) === "navigator.geolocation.getCurrentPosition"
    ) {
      geolocationCalls.push(node);
    }
    if (
      ts.isJsxElement(node) &&
      node.openingElement.tagName.getText(sourceFile) === "button" &&
      node.getText(sourceFile).includes("내 위치로 가까운 소식 보기")
    ) {
      lookupButtons.push(node);
    }
  });

  assert.equal(handlers.length, 1, "one explicit lookup handler must own geolocation");
  assert.equal(geolocationCalls.length, 1, "geolocation must have exactly one call site");
  assert.ok(ts.isBlock(handlers[0].body), "handleLookup must have an executable block body");
  assert.ok(
    geolocationCalls[0].getStart(sourceFile) >= handlers[0].body.getStart(sourceFile) &&
      geolocationCalls[0].end <= handlers[0].body.end,
    "the sole geolocation call must stay inside handleLookup",
  );
  const directCallStatements = handlers[0].body.statements.filter(
    (statement) =>
      ts.isExpressionStatement(statement) &&
      ts.isCallExpression(statement.expression) &&
      statement.expression === geolocationCalls[0],
  );
  assert.equal(
    directCallStatements.length,
    1,
    "geolocation must be a directly executed handleLookup statement",
  );
  const directCallIndex = handlers[0].body.statements.indexOf(directCallStatements[0]);
  assert.equal(
    handlers[0].body.statements
      .slice(0, directCallIndex)
      .some(statementAlwaysAbrupt),
    false,
    "handleLookup must not terminate unconditionally before geolocation",
  );
  assert.equal(lookupButtons.length, 1, "the visible lookup action must be a real button");

  const onClick = jsxAttribute(lookupButtons[0], "onClick");
  assert.ok(
    onClick &&
      onClick.initializer &&
      ts.isJsxExpression(onClick.initializer) &&
      onClick.initializer.expression &&
      ts.isIdentifier(onClick.initializer.expression) &&
      onClick.initializer.expression.text === "handleLookup",
    "the visible lookup button must bind onClick directly to handleLookup",
  );
}

const SERVER_COMPONENT_ALLOWED_MODULES = new Map([
  [
    "HomeHero.tsx",
    new Set(["@/app/_components/category/PurposeCategoryNav", "./SituationGuide"]),
  ],
  [
    "SituationGuide.tsx",
    new Set(["next/link", "lucide-react", "@/lib/featuredGuides"]),
  ],
  ["NearbyDiscovery.tsx", new Set(["next/link", "./HomeNearbyMap.client"])],
  [
    "LatestPetMarquee.tsx",
    new Set(["@/components/patterns/MarqueeRail.client", "@/lib/homeFeed"]),
  ],
]);
const SERVER_COMPONENT_FORBIDDEN_IDENTIFIERS = new Set([
  "apiClient",
  "navigator",
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "useState",
  "useEffect",
  "useLayoutEffect",
  "useReducer",
  "useRef",
  "useMemo",
  "useCallback",
  "useSyncExternalStore",
]);

function assertServerComponentBoundary(source, fileName) {
  const sourceFile = parseTsx(source, fileName);
  const directives = sourceFile.statements
    .filter(ts.isExpressionStatement)
    .map((statement) => statement.expression)
    .filter(ts.isStringLiteral)
    .map((literal) => literal.text);
  assert.equal(directives.includes("use client"), false, `${fileName} must remain a Server Component`);

  const allowedModules = SERVER_COMPONENT_ALLOWED_MODULES.get(fileName);
  assert.ok(allowedModules, `missing server import allowlist for ${fileName}`);
  const importedModules = sourceFile.statements
    .filter(ts.isImportDeclaration)
    .map((statement) => statement.moduleSpecifier)
    .filter(ts.isStringLiteral)
    .map((moduleSpecifier) => moduleSpecifier.text);
  assert.deepEqual(
    [...importedModules].sort(),
    [...allowedModules].sort(),
    `${fileName} imports must stay inside its audited Server Component boundary`,
  );

  for (const statement of sourceFile.statements) {
    assert.equal(
      ts.isExportDeclaration(statement) && Boolean(statement.moduleSpecifier),
      false,
      `${fileName} must not re-export an unaudited module`,
    );
  }

  walk(sourceFile, (node) => {
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require"))
    ) {
      assert.fail(`${fileName} must not dynamically load browser-only modules`);
    }
    if (
      ts.isElementAccessExpression(node) &&
      node.argumentExpression &&
      ts.isStringLiteral(node.argumentExpression) &&
      SERVER_COMPONENT_FORBIDDEN_IDENTIFIERS.has(node.argumentExpression.text)
    ) {
      assert.fail(
        `${fileName} must not use computed browser-only access ${node.argumentExpression.text}`,
      );
    }
    if (!ts.isIdentifier(node)) return;
    assert.equal(
      SERVER_COMPONENT_FORBIDDEN_IDENTIFIERS.has(node.text),
      false,
      `${fileName} must not reference browser-only identifier ${node.text}`,
    );
  });
}

function assertRadiusKeyboardFocusContract(source) {
  const sourceFile = parseTsx(source, "HomeNearbyMap.client.tsx");
  const radiusInputs = [];
  walk(sourceFile, (node) => {
    if (
      ts.isJsxSelfClosingElement(node) &&
      node.tagName.getText(sourceFile) === "input" &&
      jsxStringAttribute({ openingElement: node }, "name") === "nearby-radius"
    ) {
      radiusInputs.push(node);
    }
  });
  assert.equal(radiusInputs.length, 1, "one mapped nearby-radius radio template must exist");
  const radiusInput = radiusInputs[0];
  assert.equal(jsxStringAttribute({ openingElement: radiusInput }, "type"), "radio");
  const value = jsxAttribute({ openingElement: radiusInput }, "value");
  assert.ok(
    value?.initializer &&
      ts.isJsxExpression(value.initializer) &&
      value.initializer.expression &&
      ts.isIdentifier(value.initializer.expression) &&
      value.initializer.expression.text === "radius",
    "the radio value must use the mapped radius",
  );
  const inputClasses = new Set(
    (jsxStringAttribute({ openingElement: radiusInput }, "className") ?? "").split(/\s+/),
  );
  assert.equal(inputClasses.has("sr-only"), true, "the native radio must remain focusable");
  assert.equal(inputClasses.has("hidden"), false);

  let radiusLabel = radiusInput.parent;
  while (
    radiusLabel &&
    (!ts.isJsxElement(radiusLabel) ||
      radiusLabel.openingElement.tagName.getText(sourceFile) !== "label")
  ) {
    radiusLabel = radiusLabel.parent;
  }
  assert.ok(radiusLabel && ts.isJsxElement(radiusLabel), "the radio must be owned by a visible label");
  assert.equal(
    Boolean(jsxAttribute(radiusLabel, "hidden")),
    false,
    "the owning radius label must not use the hidden attribute",
  );
  assert.notEqual(
    jsxStringAttribute(radiusLabel, "aria-hidden"),
    "true",
    "the owning radius label must remain exposed",
  );
  const radiusExpressionIndex = radiusLabel.children.findIndex(
    (child) =>
      ts.isJsxExpression(child) &&
      child.expression &&
      ts.isIdentifier(child.expression) &&
      child.expression.text === "radius",
  );
  assert.notEqual(
    radiusExpressionIndex,
    -1,
    "the visible label must render its mapped radius",
  );
  assert.equal(
    radiusLabel.children
      .slice(radiusExpressionIndex + 1)
      .some((child) => ts.isJsxText(child) && child.text.trim() === "km"),
    true,
    "the visible radius value must include the km unit",
  );
  const labelClasses = new Set(
    (jsxStringAttribute(radiusLabel, "className") ?? "").split(/\s+/),
  );
  for (const hiddenClass of ["hidden", "invisible", "sr-only", "opacity-0"]) {
    assert.equal(labelClasses.has(hiddenClass), false, `radius label must not use ${hiddenClass}`);
  }
  for (const requiredClass of [
    "has-[:focus-visible]:ring-2",
    "has-[:focus-visible]:ring-action-primary",
    "has-[:focus-visible]:ring-offset-2",
  ]) {
    assert.equal(labelClasses.has(requiredClass), true, `radius label requires ${requiredClass}`);
  }
}

function conditionalMappings(node, sourceFile) {
  const mappings = [];
  walk(node, (candidate) => {
    if (
      ts.isConditionalExpression(candidate) &&
      candidate.condition.getText(sourceFile).replace(/\s+/g, " ") ===
        'item.missingAnimalStatus === "SEARCHING"' &&
      ts.isStringLiteral(candidate.whenTrue) &&
      ts.isStringLiteral(candidate.whenFalse)
    ) {
      mappings.push([candidate.whenTrue.text, candidate.whenFalse.text]);
    }
  });
  return mappings;
}

function assertNearbyStatusPresentation(source) {
  const sourceFile = parseTsx(source, "HomeNearbyMap.client.tsx");
  const markerMappings = [];
  const listMappings = [];
  walk(sourceFile, (node) => {
    if (
      ts.isJsxElement(node) &&
      node.openingElement.tagName.getText(sourceFile) === "CustomOverlayMap"
    ) {
      const markerSpans = [];
      walk(node, (candidate) => {
        if (
          ts.isJsxSelfClosingElement(candidate) &&
          candidate.tagName.getText(sourceFile) === "span" &&
          jsxStringAttribute({ openingElement: candidate }, "aria-hidden") === "true"
        ) {
          markerSpans.push(candidate);
        }
      });
      assert.equal(markerSpans.length, 1, "each overlay must own one decorative marker");
      const markerClass = jsxAttribute({ openingElement: markerSpans[0] }, "className");
      assert.ok(markerClass?.initializer && ts.isJsxExpression(markerClass.initializer));
      markerMappings.push(...conditionalMappings(markerClass.initializer, sourceFile));
    }

    if (
      ts.isJsxElement(node) &&
      node.openingElement.tagName.getText(sourceFile) === "ul" &&
      jsxStringAttribute(node, "aria-label") === "가까운 공개 위치 소식"
    ) {
      const resultLinks = [];
      walk(node, (candidate) => {
        if (
          ts.isJsxElement(candidate) &&
          candidate.openingElement.tagName.getText(sourceFile) === "Link"
        ) {
          resultLinks.push(candidate);
        }
      });
      assert.equal(resultLinks.length, 1, "the semantic list must own one result-link template");
      const statusSpan = resultLinks[0].children.find(ts.isJsxElement);
      assert.ok(statusSpan, "the result link must render a direct status element first");
      assert.equal(
        statusSpan.openingElement.tagName.getText(sourceFile),
        "span",
        "the first rendered result-link element must be the status span",
      );
      const statusClasses = new Set(
        (jsxStringAttribute(statusSpan, "className") ?? "").split(/\s+/),
      );
      for (const requiredClass of ["text-xs", "font-semibold", "text-clay"]) {
        assert.equal(statusClasses.has(requiredClass), true);
      }
      for (const hiddenClass of ["hidden", "invisible", "sr-only", "opacity-0"]) {
        assert.equal(statusClasses.has(hiddenClass), false);
      }
      assert.notEqual(jsxStringAttribute(statusSpan, "aria-hidden"), "true");
      const directStatusConditions = statusSpan.children
        .filter(ts.isJsxExpression)
        .map((child) => child.expression)
        .filter((expression) => expression && ts.isConditionalExpression(expression));
      assert.equal(directStatusConditions.length, 1, "the visible status span needs one direct mapping");
      listMappings.push(...conditionalMappings(directStatusConditions[0], sourceFile));
    }
  });
  assert.deepEqual(markerMappings, [["bg-map-missing", "bg-map-sighting"]]);
  assert.deepEqual(listMappings, [["찾는 중", "목격"]]);
}

function assertHomeSnapshotComposition(source) {
  assert.doesNotMatch(source, /^"use client";/);
  assert.doesNotMatch(source, /useRouter|useToast|useIsLoginStore|useState/);
  assert.doesNotMatch(source, /banner\.jpg|무엇을 도와드릴까요/);
  assert.equal((source.match(/getHomeFeedSnapshot\(\)/g) ?? []).length, 1);
  assert.match(source, /const snapshot = await getHomeFeedSnapshot\(\)/);
  assert.match(source, /toMarqueeItems\(snapshot\)/);
  assert.match(source, /toLostSeed\(snapshot\.lost\)/);
  assert.match(source, /toAbandonmentSeed\(snapshot\.abandonment\)/);
  const order = ["<HomeHero", "<SearchBar", "<LatestPetMarquee", "<NearbyDiscovery", "<HomeFeed"];
  let cursor = -1;
  for (const token of order) {
    const next = source.indexOf(token);
    assert.ok(next > cursor, `${token} must retain the approved home order`);
    cursor = next;
  }
}

function assertNearbyConcurrencyContract(source) {
  assert.match(source, /^"use client";/);
  assert.match(source, /import apiClient from "@\/lib\/api"/);
  assert.equal((source.match(/useEffect\(\(\) => \{/g) ?? []).length, 1);
  assert.match(source, /navigator\.geolocation\.getCurrentPosition/);
  assert.match(source, /const handleLookup =/);
  const mountEffect = source.slice(
    source.indexOf("useEffect(() => {"),
    source.indexOf("  }, []);") + "  }, []);".length,
  );
  assert.doesNotMatch(mountEffect, /navigator\.geolocation|getCurrentPosition|handleLookup/);
  assert.ok(source.indexOf("const handleLookup =") < source.indexOf("navigator.geolocation.getCurrentPosition"));
  assert.match(source, /apiClient\.get\("\/posts\/nearby",\s*\{[\s\S]*?params:\s*\{[\s\S]*?lat,[\s\S]*?lng,[\s\S]*?radiusKm,[\s\S]*?pageSize: 20,[\s\S]*?pageOffset: 0,[\s\S]*?signal: controller\.signal/);
  assert.match(source, /lookupSequenceRef\.current \+= 1/);
  assert.match(source, /activeControllerRef\.current\?\.abort\(\)/);
  assert.match(source, /useEffect\(\(\) => \{\s*mountedRef\.current = true;/);
  const staleGuard = /if \(!mountedRef\.current \|\| sequence !== lookupSequenceRef\.current\) return;/;
  assert.match(source, /async \(position\) => \{\s*if \(!mountedRef\.current \|\| sequence !== lookupSequenceRef\.current\) return;/);
  assert.match(source, /await apiClient\.get\("\/posts\/nearby",[\s\S]*?\);\s*if \(!mountedRef\.current \|\| sequence !== lookupSequenceRef\.current\) return;\s*const result = normalizeNearbyResponse/);
  assert.match(source, /\} catch \{\s*if \(!mountedRef\.current \|\| sequence !== lookupSequenceRef\.current\) return;/);
  assert.match(source, /\} finally \{\s*if \(!mountedRef\.current \|\| sequence !== lookupSequenceRef\.current\) return;/);
  assert.match(source, /\(error\) => \{\s*if \(!mountedRef\.current \|\| sequence !== lookupSequenceRef\.current\) return;/);
  assert.ok((source.match(new RegExp(staleGuard.source, "g")) ?? []).length >= 5);
  assert.match(source, /return \(\) => \{[\s\S]*?mountedRef\.current = false;[\s\S]*?lookupSequenceRef\.current \+= 1;[\s\S]*?activeControllerRef\.current\?\.abort\(\)/);
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
}

test("home category navigation separates real links from planned non-links", () => {
  assert.match(categoryNav, /HOME_PURPOSE_CATEGORIES/);
  assert.match(categoryNav, /availableCategories\.map/);
  assert.match(categoryNav, /plannedCategories\.map/);
  assert.match(categoryNav, /<Link[\s\S]*?href=\{category\.href\}/);
  const plannedBlock = categoryNav.slice(categoryNav.indexOf("plannedCategories.map"));
  assert.match(plannedBlock, /<li/);
  assert.match(plannedBlock, /준비 중/);
  assert.doesNotMatch(plannedBlock, /<Link|href=/);

  const plannedLinkMutation = plannedBlock.replace("<li", '<Link href={category.href}');
  assert.throws(() => assert.doesNotMatch(plannedLinkMutation, /<Link|href=/));
});

test("home hero owns the exact H1 and all guide registry links remain real", () => {
  assert.equal((hero.match(/<h1\b/g) ?? []).length, 1);
  assert.match(hero, />다시 만나는 길을, 동네와 함께\.<\/h1>/);
  assert.match(hero, /<PurposeCategoryNav/);
  assert.match(hero, /<SituationGuide/);
  assert.equal((guide.match(/<h1\b/g) ?? []).length, 0);
  assert.match(guide, /상황별 반려동물 안내/);
  assert.match(guide, /FEATURED_GUIDES\.map/);
  assert.match(guide, /href=\{item\.href\}/);
  assert.match(guide, /item\.title/);
  assert.match(guide, /item\.description/);
  assert.match(guide, /item\.linkLabel/);
  assert.doesNotMatch(guide, />\s*FAQ\s*</);
});

test("server home uses one snapshot for marquee and both Task 6 seeds", () => {
  assertHomeSnapshotComposition(page);
  const secondSnapshotMutation = page.replace(
    "toMarqueeItems(snapshot)",
    "toMarqueeItems(await getHomeFeedSnapshot())",
  );
  assert.throws(() => assertHomeSnapshotComposition(secondSnapshotMutation));
});

test("nearby lookup is explicit, abortable, stale-safe, and truthful", () => {
  assertNearbyConcurrencyContract(nearbyMap);
  assertExplicitNearbyButtonContract(nearbyMap);
  assert.match(nearbyMap, /내 위치로 가까운 소식 보기/);
  assert.match(nearbyMap, /1, 3, 5, 10/);
  assert.match(nearbyMap, /useState<RadiusKm>\(3\)/);
  assert.match(nearbyMap, /const handleRadiusChange =/);
  assert.match(nearbyMap, /handleRadiusChange[\s\S]*?lookupSequenceRef\.current \+= 1;[\s\S]*?activeControllerRef\.current\?\.abort\(\);[\s\S]*?setItems\(\[\]\);[\s\S]*?setCoordinate\(null\);/);
  assert.match(nearbyMap, /disabled=\{busy\}[\s\S]*?onChange=\{\(\) => handleRadiusChange\(radius\)\}/);
  assert.match(nearbyMap, /표시 가능한 공개 위치 소식이 없어요/);
  assert.match(nearbyMap, /좌표.*이번 조회.*전송/);
  assert.match(nearbyMap, /브라우저 저장소에 저장하지 않/);
  assert.match(nearbyMap, /보관 여부/);
  assert.match(nearbyMap, /<ul/);
  assert.match(nearbyMap, /href=\{item\.href\}/);
  assert.match(nearbyMap, /bg-map-missing/);
  assert.match(nearbyMap, /bg-map-sighting/);

  const geolocationEffectMutation = nearbyMap.replace(
    "  useEffect(() => {\n",
    "  useEffect(() => {\n    navigator.geolocation.getCurrentPosition(() => {}, () => {});\n",
  );
  assert.throws(() => assertNearbyConcurrencyContract(geolocationEffectMutation));
  const handlerEffectMutation = nearbyMap.replace(
    "  useEffect(() => {\n",
    "  useEffect(() => {\n    handleLookup();\n",
  );
  assert.throws(() => assertNearbyConcurrencyContract(handlerEffectMutation));
  const secondHandlerEffectMutation = nearbyMap.replace(
    "  const busy =",
    "  useEffect(() => {\n    handleLookup();\n  }, []);\n\n  const busy =",
  );
  assert.throws(() => assertNearbyConcurrencyContract(secondHandlerEffectMutation));
  const successStaleMutation = nearbyMap.replace(
    "          if (!mountedRef.current || sequence !== lookupSequenceRef.current) return;\n          const result = normalizeNearbyResponse",
    "          const result = normalizeNearbyResponse",
  );
  assert.throws(() => assertNearbyConcurrencyContract(successStaleMutation));

  const noOpButtonMutation = nearbyMap.replace(
    "onClick={handleLookup}",
    "onClick={() => undefined}",
  );
  assert.throws(() => assertExplicitNearbyButtonContract(noOpButtonMutation));
  const missingButtonBindingMutation = nearbyMap.replace(
    "onClick={handleLookup}",
    'aria-label="위치 조회"',
  );
  assert.throws(() => assertExplicitNearbyButtonContract(missingButtonBindingMutation));
  const secondGeolocationMutation = nearbyMap.replace(
    "export default function HomeNearbyMap()",
    "navigator.geolocation.getCurrentPosition(() => {}, () => {});\n\nexport default function HomeNearbyMap()",
  );
  assert.throws(() => assertExplicitNearbyButtonContract(secondGeolocationMutation));
  const earlyReturnMutation = nearbyMap.replace(
    '    setLookupStatus("locating");',
    '    return;\n    setLookupStatus("locating");',
  );
  assert.throws(() => assertExplicitNearbyButtonContract(earlyReturnMutation));
  const conditionalEarlyReturnMutation = nearbyMap.replace(
    '    setLookupStatus("locating");',
    '    if (true) return;\n    setLookupStatus("locating");',
  );
  assert.throws(() => assertExplicitNearbyButtonContract(conditionalEarlyReturnMutation));
  const deferredGeolocationMutation = nearbyMap.replace(
    "    navigator.geolocation.getCurrentPosition(",
    "    const deferredGeolocation = () => navigator.geolocation.getCurrentPosition(",
  );
  assert.throws(() => assertExplicitNearbyButtonContract(deferredGeolocationMutation));
});

test("home static sections preserve their Server Component boundaries", () => {
  const serverComponents = [
    ["HomeHero.tsx", hero],
    ["SituationGuide.tsx", guide],
    ["NearbyDiscovery.tsx", nearby],
    ["LatestPetMarquee.tsx", latestMarquee],
  ];

  for (const [fileName, source] of serverComponents) {
    assertServerComponentBoundary(source, fileName);
    assert.throws(() => assertServerComponentBoundary(`"use client";\n${source}`, fileName));
    assert.throws(() =>
      assertServerComponentBoundary(
        `import apiClient from "@/lib/api";\n${source}`,
        fileName,
      ),
    );
    assert.throws(() =>
      assertServerComponentBoundary(
        `import { Map as KakaoMap } from "react-kakao-maps-sdk";\n${source}`,
        fileName,
      ),
    );
    assert.throws(() =>
      assertServerComponentBoundary(
        `const browserModule = import("@/lib/api");\n${source}`,
        fileName,
      ),
    );
    assert.throws(() =>
      assertServerComponentBoundary(
        `import UnexpectedClient from "./Unexpected.client";\n${source}`,
        fileName,
      ),
    );
    assert.throws(() =>
      assertServerComponentBoundary(
        `export { default as leakedApi } from "@/lib/api";\n${source}`,
        fileName,
      ),
    );
    assert.throws(() =>
      assertServerComponentBoundary(
        `const requiredApi = require("@/lib/api");\n${source}`,
        fileName,
      ),
    );
    assert.throws(() =>
      assertServerComponentBoundary(
        `import { useRef } from "react";\n${source}`,
        fileName,
      ),
    );
    assert.throws(() =>
      assertServerComponentBoundary(
        `const browserNavigator = globalThis["navigator"];\n${source}`,
        fileName,
      ),
    );
  }
});

test("nearby radius radios expose distinct keyboard focus on their visible labels", () => {
  assertRadiusKeyboardFocusContract(nearbyMap);
  const missingFocusMutation = nearbyMap.replaceAll(/\s+has-\[:focus-visible\]:\S+/g, "");
  assert.throws(() => assertRadiusKeyboardFocusContract(missingFocusMutation));
  assert.throws(() =>
    assertRadiusKeyboardFocusContract(
      nearbyMap.replace('type="radio"', 'type="checkbox"'),
    ),
  );
  assert.throws(() =>
    assertRadiusKeyboardFocusContract(
      nearbyMap.replace('name="nearby-radius"', 'name="other-radius"'),
    ),
  );
  assert.throws(() =>
    assertRadiusKeyboardFocusContract(
      nearbyMap.replace('className="sr-only"', 'className="hidden"'),
    ),
  );
  assert.throws(() =>
    assertRadiusKeyboardFocusContract(nearbyMap.replace("{radius}km", "")),
  );
  const hiddenLabelMutation = nearbyMap.replace(
    'className="inline-flex min-h-11',
    'className="hidden inline-flex min-h-11',
  );
  assert.throws(() => assertRadiusKeyboardFocusContract(hiddenLabelMutation));
  const invisibleLabelMutation = nearbyMap.replace(
    'className="inline-flex min-h-11',
    'className="invisible inline-flex min-h-11',
  );
  assert.throws(() => assertRadiusKeyboardFocusContract(invisibleLabelMutation));
  const hiddenAttributeMutation = nearbyMap.replace(
    "<label key={radius}",
    "<label hidden key={radius}",
  );
  assert.throws(() => assertRadiusKeyboardFocusContract(hiddenAttributeMutation));
});

test("nearby SEARCHING and SEEN presentation keeps exact pin and list mappings", () => {
  assertNearbyStatusPresentation(nearbyMap);
  const swappedPinMutation = nearbyMap.replace(
    '? "bg-map-missing" : "bg-map-sighting"',
    '? "bg-map-sighting" : "bg-map-missing"',
  );
  assert.throws(() => assertNearbyStatusPresentation(swappedPinMutation));
  const swappedLabelMutation = nearbyMap.replace(
    '? "찾는 중" : "목격"',
    '? "목격" : "찾는 중"',
  );
  assert.throws(() => assertNearbyStatusPresentation(swappedLabelMutation));
  const decoyMappingsMutation = `${swappedPinMutation}\nconst decoyPin = item.missingAnimalStatus === "SEARCHING" ? "bg-map-missing" : "bg-map-sighting";`;
  assert.throws(() => assertNearbyStatusPresentation(decoyMappingsMutation));
  const inListDecoyMutation = swappedLabelMutation.replace(
    '<li key={`${item.id}:${index}`}>',
    '<li key={`${item.id}:${index}`}><span className="sr-only">{item.missingAnimalStatus === "SEARCHING" ? "찾는 중" : "목격"}</span>',
  );
  assert.throws(() => assertNearbyStatusPresentation(inListDecoyMutation));
});

test("Kakao canvas is readiness-gated while the semantic result list stays available", () => {
  assert.match(kakaoScript, /export type KakaoMapStatus = "loading" \| "ready" \| "unavailable" \| "failed"/);
  assert.match(kakaoScript, /export function useKakaoMapStatus/);
  assert.match(kakaoScript, /k\.maps\.load\(\(\) =>/);
  assert.match(kakaoScript, /onError=/);
  assert.match(nearbyMap, /Map as KakaoMap, Circle, CustomOverlayMap/);
  assert.match(nearbyMap, /mapStatus === "ready"/);
  assert.match(nearbyMap, /<KakaoMap/);
  assert.match(nearbyMap, /\{items\.length > 0 \? \(\s*<ul/);
  const hiddenListMutation = nearbyMap.replace(
    "{items.length > 0 ? (\n          <ul",
    '{mapStatus === "ready" && items.length > 0 ? (\n          <ul',
  );
  assert.doesNotMatch(hiddenListMutation, /\{items\.length > 0 \? \(\s*<ul/);
  assert.throws(() => assert.match(hiddenListMutation, /\{items\.length > 0 \? \(\s*<ul/));
});

test("nearby section exposes a real regional route and a non-clickable future status", () => {
  assert.match(nearby, /가까운 곳부터 함께 살펴봐요/);
  assert.match(nearby, /href="\/abandonment\/region"/);
  assert.match(nearby, /수색그룹과 팀 지도 · 준비 중/);
  const futureStatus = nearby.slice(nearby.indexOf("수색그룹과 팀 지도 · 준비 중") - 250);
  assert.doesNotMatch(futureStatus, /href=.*수색그룹|<Link[^>]*>[^<]*수색그룹/);
});

test("latest marquee renders only actual items and valid absolute dates", () => {
  assert.match(latestMarquee, /if \(items\.length === 0\) return null/);
  assert.match(latestMarquee, /<MarqueeRail items=\{items\} \/>/);
  assert.match(marquee, /items\.map/);
  assert.match(marquee, /formatMarqueeDate/);
  assert.match(marquee, /dateTime && formattedDate \? \(/);
  assert.match(marquee, /<time dateTime=\{dateTime\}/);
  assert.match(marquee, /overflow-x-auto/);
  assert.doesNotMatch(marquee, /next\/image|<Image|Date\.now|setInterval/);
});

test("nearby map keys preserve duplicate public records without collisions", () => {
  assert.match(nearbyMap, /items\.map\(\(item, index\) =>/);
  assert.ok((nearbyMap.match(/key=\{`\$\{item\.id\}:\$\{index\}`\}/g) ?? []).length >= 2);
});

function assertListsStayMounted(source) {
  assert.match(
    source,
    /<section hidden=\{!showLost\} className="w-full">[\s\S]*?<LostList initialPage=\{lostSeed\} \/>[\s\S]*?<\/section>/,
  );
  assert.match(
    source,
    /<section hidden=\{!showAbandonment\} className="w-full">[\s\S]*?<Suspense[\s\S]*?<AbandonmentList initialPage=\{abandonmentSeed\} \/>[\s\S]*?<\/Suspense>[\s\S]*?<\/section>/,
  );
  assert.doesNotMatch(source, /\{showLost && \(\s*<section/);
  assert.doesNotMatch(source, /\{showAbandonment && \(\s*<section/);
  assert.equal((source.match(/<LostList initialPage=\{lostSeed\} \/>/g) ?? []).length, 1);
  assert.equal(
    (source.match(/<AbandonmentList initialPage=\{abandonmentSeed\} \/>/g) ?? []).length,
    1,
  );
}

test("home guidance links retain their stable destinations", () => {
  assert.deepEqual(
    content.FEATURED_GUIDES.map(({ id, href }) => ({ id, href })),
    [
      { id: "lost-first-steps", href: "/guide#수색" },
      { id: "shelter-return", href: "/faq#shelter-return" },
      { id: "adoption-process", href: "/faq#adoption-process" },
      { id: "missing-prevention", href: "/posts/dog-escape-while-walking" },
    ],
  );
});

test("FAQ entries retain their exact ordered stable guide anchors", () => {
  assert.deepEqual(
    content.FAQ_ENTRIES.map(({ id }) => id),
    [
      "shelter-check",
      "notice-period",
      "shelter-return",
      "animal-registration",
      "found-animal-report",
      "after-notice",
      "adoption-process",
      "missing-report",
      "data-source",
      "search-radius",
    ],
  );
  assert.equal(new Set(content.FAQ_ENTRIES.map(({ id }) => id)).size, content.FAQ_ENTRIES.length);
});

test("both site search variants remain accessible native GET forms", () => {
  const forms = [...searchBar.matchAll(/<form\b[\s\S]*?<\/form>/g)].map(([form]) => form);

  assert.equal(forms.length, 2, "hero and compact search forms must both exist");

  for (const form of forms) {
    assert.match(form, /action="\/search"/);
    assert.match(form, /method="get"/);
    assert.match(form, /name="q"/);
    assert.match(form, /defaultValue=\{defaultQ\}/);
    assert.match(form, /required/);
    assert.match(form, /<label[\s\S]*?실종 또는 보호 동물 검색[\s\S]*?<\/label>/);
  }

  const [heroForm, compactForm] = forms;
  assert.match(heroForm, /placeholder="실종 \/ 보호중 동물 검색 — 지역, 품종, 특징 등"/);
  assert.match(compactForm, /placeholder="실종 \/ 보호중 검색"/);
  assert.match(compactForm, /className="flex items-center"/);
  assert.match(compactForm, /w-44 lg:w-64/);
  assert.doesNotMatch(compactForm, /w-full/);
  assert.doesNotMatch(compactForm, /<button\b/);

  assert.doesNotMatch(searchBar, /"use client"/);
  assert.doesNotMatch(searchBar, /useRouter/);
  assert.doesNotMatch(searchBar, /preventDefault/);
  assert.doesNotMatch(searchBar, /router\.push/);
});

test("홈 피드 client island는 서버 seed와 기존 상호작용을 보존한다", () => {
  assert.match(homeFeed, /^"use client";/);
  assert.match(homeFeed, /export interface HomeFeedProps\s*\{[\s\S]*?lostSeed\?: HomeListSeed<LostPetSummary>/);
  assert.match(homeFeed, /abandonmentSeed\?: HomeListSeed<AbandonedAnimalSummary>/);
  assert.match(homeFeed, /data-native-scroll/);
  assert.match(homeFeed, /<LostList initialPage=\{lostSeed\} \/>/);
  assert.match(homeFeed, /<AbandonmentList initialPage=\{abandonmentSeed\} \/>/);
  assert.match(homeFeed, /<Suspense fallback=\{<div className="h-\[400px\]" \/>\}>/);
  assert.match(homeFeed, />\s*전체\s*</);
  assert.match(homeFeed, />\s*집을 잃었어요\s*</);
  assert.match(homeFeed, />\s*보호소에서 가족을 기다려요\s*</);
  assert.match(homeFeed, /useIsLoginStore/);
  assert.match(homeFeed, /router\.push\('\/register'\)/);
  assert.match(homeFeed, /로그인이 필요합니다/);
  assert.doesNotMatch(homeFeed, /homeFeed\.server/);
  assert.doesNotMatch(homeFeed, /SearchBar/);
  assert.doesNotMatch(homeFeed, /PurposeCategoryNav/);

  assertListsStayMounted(homeFeed);

  const missingLostSeed = homeFeed.replace("<LostList initialPage={lostSeed} />", "<LostList />");
  assert.doesNotMatch(missingLostSeed, /<LostList initialPage=\{lostSeed\} \/>/);

  const remountOnToggleMutation = homeFeed.replace(
    '<section hidden={!showLost} className="w-full">',
    '{showLost && (\n        <section className="w-full">',
  );
  assert.throws(() => assertListsStayMounted(remountOnToggleMutation));

  const abandonmentRemountMutation = homeFeed.replace(
    '<section hidden={!showAbandonment} className="w-full">',
    '{showAbandonment && (\n        <section className="w-full">',
  );
  assert.throws(() => assertListsStayMounted(abandonmentRemountMutation));
});
