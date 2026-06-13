/**
 * ESLint カスタムルール: no-direct-router-push
 *
 * expo-router の router.push / router.replace / router.back の直接使用を禁止し、
 * lib/navigation の navigate.* / navigateReplace.* / navigateBack を使用するよう強制します。
 *
 * 例外: lib/navigation/app-routes.ts 内のみ許可
 * 
 * v6.39: GPTレビューに基づき、expo-router由来のrouterのみを禁止するよう改良
 * - import { router } from "expo-router" をトラッキング
 * - const router = useRouter() もトラッキング（別名対応）
 * - 誤爆防止（他ライブラリのrouter、関数引数routerなどは対象外）
 */

const EXPO_ROUTER_MODULE = "expo-router";
const METHODS = new Set(["push", "replace", "back"]);

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow direct usage of router.push/replace/back from expo-router",
      recommended: true,
    },
    messages: {
      noDirectRouterPush:
        "expo-router の router.push() の直接使用は禁止です。navigate.toXxx() を使用してください。(lib/navigation)",
      noDirectRouterReplace:
        "expo-router の router.replace() の直接使用は禁止です。navigateReplace.toXxx() を使用してください。(lib/navigation)",
      noDirectRouterBack:
        "expo-router の router.back() の直接使用は禁止です。navigateBack() を使用してください。(lib/navigation)",
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename();

    // 例外（app-routes.ts/tsx のみ許可）
    if (
      filename.endsWith("/lib/navigation/app-routes.ts") ||
      filename.endsWith("\\lib\\navigation\\app-routes.ts") ||
      filename.endsWith("/lib/navigation/app-routes.tsx") ||
      filename.endsWith("\\lib\\navigation\\app-routes.tsx") ||
      // テストファイルも例外
      filename.includes("__tests__/navigation")
    ) {
      return {};
    }

    // expo-router から import された router / useRouter の「ローカル名」を保持
    let importedRouterName = null;       // 例: router, expoRouter など
    let importedUseRouterName = null;    // 例: useRouter, useExpoRouter など

    // useRouter() の戻り値を受けた変数名（router相当）を保持
    const routerLikeNames = new Set();   // 例: router, r, myRouter など

    function reportByMethod(node, methodName) {
      if (methodName === "push") {
        context.report({ node, messageId: "noDirectRouterPush" });
      } else if (methodName === "replace") {
        context.report({ node, messageId: "noDirectRouterReplace" });
      } else if (methodName === "back") {
        context.report({ node, messageId: "noDirectRouterBack" });
      }
    }

    return {
      Program() {
        importedRouterName = null;
        importedUseRouterName = null;
        routerLikeNames.clear();
      },

      // import { router as xxx, useRouter as yyy } from "expo-router"
      ImportDeclaration(node) {
        if (!node.source || node.source.value !== EXPO_ROUTER_MODULE) return;

        for (const spec of node.specifiers || []) {
          if (spec.type === "ImportSpecifier") {
            const imported = spec.imported && spec.imported.name;
            const local = spec.local && spec.local.name;

            if (imported === "router") importedRouterName = local;
            if (imported === "useRouter") importedUseRouterName = local;
          }
        }

        // router 自体を import している場合は、それを routerLike としても扱う
        if (importedRouterName) routerLikeNames.add(importedRouterName);
      },

      // const r = useRouter()
      VariableDeclarator(node) {
        if (!importedUseRouterName) return;

        if (
          node.init &&
          node.init.type === "CallExpression" &&
          node.init.callee &&
          node.init.callee.type === "Identifier" &&
          node.init.callee.name === importedUseRouterName &&
          node.id &&
          node.id.type === "Identifier"
        ) {
          routerLikeNames.add(node.id.name);
        }
      },

      // routerLike.push()/replace()/back() の検出
      CallExpression(node) {
        const callee = node.callee;
        if (!callee || callee.type !== "MemberExpression") return;

        // routerLike.xxx()
        const obj = callee.object;
        const prop = callee.property;

        if (!obj || obj.type !== "Identifier") return;
        if (!prop || prop.type !== "Identifier") return;

        const objectName = obj.name;
        const methodName = prop.name;

        if (!METHODS.has(methodName)) return;

        // ★重要：expo-router 由来として特定できた routerLike のみを禁止
        if (routerLikeNames.has(objectName)) {
          reportByMethod(node, methodName);
        }
      },
    };
  },
};
