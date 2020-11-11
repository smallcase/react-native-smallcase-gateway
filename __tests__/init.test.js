jest.mock("react-native");

import SmallcaseGateway from "../index";
import { NativeModules } from "react-native";

describe("init", () => {
  const initFn = jest.spyOn(NativeModules.SmallcaseGateway, "init");

  test("valid", async () => {
    await SmallcaseGateway.init("test-token");
    expect(initFn).toBeCalledWith("test-token");
  });

  test("empty", async () => {
    await SmallcaseGateway.init();
    expect(initFn).toBeCalledWith("");
  });

  test("invalid", async () => {
    await SmallcaseGateway.init(undefined);
    expect(initFn).toBeCalledWith("");

    await SmallcaseGateway.init({});
    expect(initFn).toBeCalledWith("");

    await SmallcaseGateway.init(123);
    expect(initFn).toBeCalledWith("");
  });
});
