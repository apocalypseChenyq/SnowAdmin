import { camelize } from "./camelize";

const httpRequestTypes = [
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "head",
  "options",
  "trace"
] as const;

export type ParseOptions = {
  /** 需要包含哪些 tags  */
  includeTags?: string[];
  /** 需要排除哪些 tags */
  excludeTags?: string[];
};

/** 对下载的 json 做一些处理 */
export function parseJSONFile(jsonObject: any, options?: ParseOptions) {
  const { includeTags, excludeTags } = options || {};

  // 服务中多数 info.termsOfService 没有值
  jsonObject.info.termsOfService = "https://example.com/terms";

  // 服务中多数 info.version 没有值
  if (!jsonObject.info.version) jsonObject.info.version = "1.0.0";

  // tags 的 name 使用 description 的驼峰命名
  const tagMap: Record<string, string> = {};
  jsonObject.tags?.forEach(v => {
    tagMap[v.name] = v.description;
    v.name = camelize(v.description);
  });

  // 只保留 includeTags 中的接口
  if (includeTags?.length) {
    const paths = {};
    Object.keys(jsonObject.paths).forEach(path => {
      httpRequestTypes.forEach(method => {
        if (!jsonObject.paths[path][method]) return;

        const curTags = jsonObject.paths[path][method].tags;
        if (curTags?.some((v: string) => includeTags.includes(v)))
          paths[path] = jsonObject.paths[path];
      });
    });
    jsonObject.paths = paths;
  }

  if (excludeTags?.length) {
    const paths = Object.keys(jsonObject.paths);
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      for (let j = 0; j < httpRequestTypes.length; j++) {
        const method = httpRequestTypes[j];
        if (!jsonObject.paths[path][method]) continue;

        const curTags = jsonObject.paths[path][method].tags;
        if (curTags?.some((v: string) => excludeTags.includes(v))) {
          delete jsonObject.paths[path];
          break;
        }
      }
    }
  }

  // 把所有接口的 tag 更新成英文
  Object.keys(jsonObject.paths).forEach(path => {
    httpRequestTypes.forEach(method => {
      if (!jsonObject.paths[path][method]) return;

      const curTags = jsonObject.paths[path][method].tags;
      jsonObject.paths[path][method].tags = curTags.map(tag => tagMap[tag]);
    });
  });

  return jsonObject;
}
