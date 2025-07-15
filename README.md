Got it! Here's your `README.md`, structured like the Lively Wallpaper one — clean, centered, easy to read, with headings, icons, and code formatting where needed.

---

```markdown
<p align="center">
  <img alt="ScrapBack Logo" src="resources/scrapback_banner.png" width="450" />
  <h2 align="center">ScrapBack 📦</h2>
</p>

A React Native app for managing waste pickups and recycling requests with a modern, consistent code structure.

---

## 📁 Contents

- [About](#about)
- [File Naming](#file-naming)
- [SafeAreaView Usage](#safeareaview-usage)
- [Export Convention](#export-convention)
- [Custom Components](#custom-components)
- [Icons Best Practice](#icons-best-practice)
- [Sample Login Page](#sample-login-page)

---

## 🧾 About

ScrapBack helps users request waste pickups, locate recyclers, and manage their profile — all in one place. This document outlines best practices to keep our codebase clean, consistent, and scalable.

---

## 🐪 File Naming

Use **camelCase** for all file and folder names.

✅ Correct:
```

loginScreen.js
customTabBar.js

```

❌ Avoid:
```

LoginScreen.js
custom\_tab\_bar.js

````

---

## 📐 SafeAreaView Usage

Always wrap your screens in `SafeAreaView` to avoid overlapping with notches, top bars, and system UI elements.

```js
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

<SafeAreaProvider>
  <SafeAreaView style={styles.SafeAreaView}>
    {/* Page content */}
  </SafeAreaView>
</SafeAreaProvider>
````

```js
const styles = StyleSheet.create({
  SafeAreaView: {
    flex: 1,
  },
});
```

🔗 Reference:
[React Native and iPhone X SafeAreaView](https://www.bram.us/2018/02/20/react-native-and-iphone-x-safeareaview/)

---

## 📤 Export Convention

Always export components this way to keep things modular and predictable.

✅ Correct:

```js
const Layout = () => {
  // component code
};

export default Layout;
```

❌ Avoid:

```js
export default () => {
  // anonymous export
};
```

---

## 🎨 Custom Components

Wrap your screens with `CustomBgColor` to apply our app's consistent background color.

```js
import CustomBgColor from "../components/customBgColor";

<CustomBgColor>
  {/* screen content here */}
</CustomBgColor>
```

This keeps our UI clean and unified.

---

## 🔤 Icons Best Practice

All icon libraries are pre-imported in `/components/Icons.js`.

✅ Use this instead of importing multiple icons manually:

```js
import { Icons } from "../components/Icons";

const Icon = Icons.MaterialCommunityIcons;

<Icon name="account-circle-outline" size={30} color="#008243" />
```

❌ Avoid:

```js
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
```

---

## 📄 Sample Login Page

```js
import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomBgColor from "../components/customBgColor";
import { router } from "expo-router";
import { Icons } from "../components/Icons";

const Login = () => {
  const Icon = Icons.MaterialCommunityIcons;

  return (
    <CustomBgColor>
      <SafeAreaView style={styles.SafeAreaView}>
        <View style={styles.container}>
          <Icon name="account-circle-outline" size={50} color="#008243" />
          <Text>Welcome to the Login Page!</Text>
          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text style={styles.buttonText}>Go to Signup</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </CustomBgColor>
  );
};

const styles = StyleSheet.create({
  SafeAreaView: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    marginTop: 20,
    fontSize: 16,
    color: "#fff",
    backgroundColor: "#008243",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
});

export default Login;
```

---

## 💬 Questions or Contributions?

Open issues or feature suggestions are welcome in the [Discussions](https://github.com/yourusername/scrapback/discussions) tab or in the [Issues](https://github.com/yourusername/scrapback/issues) section.

---

## ⚖️ License

This project is licensed under the [MIT License](LICENSE).

```

---

Let me know if you'd like me to include badges, install instructions, screenshots, or a live demo section like in the Lively README.
```
