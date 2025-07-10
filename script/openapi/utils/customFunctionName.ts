import { camelize } from "./camelize";

type CustomFunctionNameOptions = {
  spliceLength?: number;
};
/** 自定义函数名, 因为后端都没有定义 operationId */
export function customFunctionName(
  data: any,
  options?: CustomFunctionNameOptions
) {
  const { spliceLength = 2 } = options || {};
  let funName = data.operationId ? data.operationId : "";
  let { path } = data;

  // 如果有 /api/shop/{shopId} 的情况，删除 { 和 } 两个符号
  path = path.replace(/\{|\}/g, "");

  const arr = path
    .split("/")
    .splice(-spliceLength)
    .map(v => v.replace(/-/g, " "));
  funName = camelize(arr.join(" "));

  return funName;
}
