import { unifiedClass } from "../utils/index";

test("统一 class 格式", () => {
  expect(unifiedClass("abc cba")).toBe("abc cba");

  const array_class = ["class-a", ["class-b", "class-c"]];
  expect(unifiedClass(array_class)).toMatch(
    /\s*class-a\s*class-b\s*class-c\s*/
  );

  const dynamicClass = {
    "class-b": true,
    "class-c": true,
  };

  expect(unifiedClass(["class-a", dynamicClass])).toMatch(
    /\s*class-a\s*class-b\s*class-c\s*/
  );
});
