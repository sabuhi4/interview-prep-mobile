import "react-native-gesture-handler";
import React from "react";
import { Platform, StatusBar } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MD3LightTheme, PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "./src/context/AppContext";
import { HomeScreen } from "./src/screens/HomeScreen";
import { QuestionsScreen } from "./src/screens/QuestionsScreen";
import { QuizScreen } from "./src/screens/QuizScreen";
import { ListenScreen } from "./src/screens/ListenScreen";
import { theme } from "./src/theme";

type RootTabParamList = {
  Home: undefined;
  Questions: undefined;
  Quiz: undefined;
  Listen: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: theme.colors.indigo,
    secondary: theme.colors.blue,
    background: theme.colors.background,
    surface: theme.colors.card
  }
};

const navigationTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: theme.colors.indigo,
    background: theme.colors.background,
    card: paperTheme.colors.surface,
    text: theme.colors.text,
    border: "#d9d9d9"
  }
};

function HomeTab({ navigation }: { navigation: { navigate: (screen: keyof RootTabParamList) => void } }) {
  return (
    <HomeScreen
      onSelectTab={(tab) => {
        switch (tab) {
        case "home":
          navigation.navigate("Home");
          break;
        case "questions":
          navigation.navigate("Questions");
          break;
        case "quiz":
          navigation.navigate("Quiz");
          break;
        case "listen":
          navigation.navigate("Listen");
          break;
        }
      }}
    />
  );
}

function AppShell() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <StatusBar barStyle="dark-content" />
        <NavigationContainer theme={navigationTheme}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarActiveTintColor: theme.colors.indigo,
              tabBarInactiveTintColor: theme.colors.muted,
              tabBarHideOnKeyboard: true,
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: "600",
                marginBottom: Platform.OS === "ios" ? 2 : 4
              },
              tabBarItemStyle: {
                paddingTop: 4
              },
              tabBarStyle: {
                height: Platform.OS === "ios" ? 82 : 64,
                paddingTop: 6,
                paddingBottom: Platform.OS === "ios" ? 8 : 6,
                borderTopWidth: 1,
                borderTopColor: "#d9d9d9",
                backgroundColor: paperTheme.colors.surface
              },
              tabBarIcon: ({ color, size }) => {
                const icon =
                  route.name === "Home"
                    ? "home"
                    : route.name === "Questions"
                      ? "format-list-bulleted"
                      : route.name === "Quiz"
                        ? "head-question"
                        : "headphones";
                return <MaterialCommunityIcons name={icon} size={22} color={color} />;
              }
            })}
          >
            <Tab.Screen name="Home" component={HomeTab} />
            <Tab.Screen name="Questions" component={QuestionsScreen} />
            <Tab.Screen name="Quiz" component={QuizScreen} />
            <Tab.Screen name="Listen" component={ListenScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
