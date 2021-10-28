import { unifiedClass } from "../src/utils/index";

test("统一 class 格式", () => {
  // 字符串
  expect(unifiedClass("abc cba")).toBe("abc cba");
  // 数组
  const array_class = ["class-a", ["class-b", "class-c"]];
  expect(unifiedClass(array_class)).toMatch(
    /\s*class-a\s*class-b\s*class-c\s*/
  );

  // 对象
  const dynamicClass = {
    "class-b": true,
    "class-c": true,
  };

  expect(unifiedClass(["class-a", dynamicClass])).toMatch(
    /\s*class-a\s*class-b\s*class-c\s*/
  );

  expect(unifiedClass(dynamicClass)).toMatch(/\s*class-b\s*class-c\s*/);

  expect(() => unifiedClass(1)).toThrow("参数必须是数组或对象");
});
