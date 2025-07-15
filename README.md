
---

```markdown
# 📱 ScrapBack React Native Guidelines

Welcome to the ScrapBack project! Please follow these coding practices to keep our codebase clean, consistent, and easy to maintain.

---

## ✅ File Naming

Use **camelCase** for all file and folder names.

✅ Example:
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

## ✅ SafeAreaView: Always Use It!

To make sure your screen content doesn't overlap with the status bar (especially on devices like iPhone X), always use:

```js
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

<SafeAreaProvider>
  <SafeAreaView style={styles.SafeAreaView}>
    {/* Page content here */}
  </SafeAreaView>
</SafeAreaProvider>
````

And your styles should include:

```js
const styles = StyleSheet.create({
  SafeAreaView: {
    flex: 1,
  },
});
```

📎 Reference: [React Native and iPhone X SafeAreaView](https://www.bram.us/2018/02/20/react-native-and-iphone-x-safeareaview/)

---

## ✅ Export Default Format

Always define your components before exporting them. This makes your code easier to read, reuse, and debug.

✅ Correct:

```js
const Layout = () => {
  // component logic
};

export default Layout;
```

❌ Don’t do this:

```js
export default () => {
  // logic here
};
```

---

## ✅ Use CustomBgColor for Page Backgrounds

In `/components/customBgColor.js`, we created a wrapper that applies the app’s background styling. Just wrap your page content with it like this:

```js
<CustomBgColor>
  {/* Page content */}
</CustomBgColor>
```

This keeps all screens visually consistent.

---

## ✅ Use the Icons Component for All Icons

Instead of importing multiple icons on every screen like this:

```js
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
```

**Just use the shortcut:**

```js
import { Icons } from "../components/Icons";

const Icon = Icons.MaterialCommunityIcons;

<Icon name="account-circle-outline" size={30} color="#008243" />
```

This is cleaner and more efficient — especially when using multiple icon sets.

---

### ✅ Sample: Login Screen

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
