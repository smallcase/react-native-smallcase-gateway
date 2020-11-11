jest.mock("react-native");

import SmallcaseGateway from "../index";
import { NativeModules } from "react-native";

test("init test", async () => {
  const initFn = jest.spyOn(NativeModules.SmallcaseGateway, "init");

  await SmallcaseGateway.init("test-token");
  expect(initFn).toBeCalledWith("test-token");

  await SmallcaseGateway.init();
  expect(initFn).toBeCalledWith("");

  await SmallcaseGateway.init(undefined);
  expect(initFn).toBeCalledWith("");

  await SmallcaseGateway.init({});
  expect(initFn).toBeCalledWith("");

  await SmallcaseGateway.init(123);
  expect(initFn).toBeCalledWith("");
});
