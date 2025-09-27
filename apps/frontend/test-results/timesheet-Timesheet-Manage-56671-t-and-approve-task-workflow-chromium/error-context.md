# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img "ATW Humanitae" [ref=e5]
      - heading "Connexion" [level=1] [ref=e6]
      - paragraph [ref=e7]: ATW TimeSheet
    - form [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]: Nom d'utilisateur ou Email
        - textbox "Nom d'utilisateur ou Email" [ref=e11]: test@example.com
      - generic [ref=e12]:
        - generic [ref=e13]: Mot de passe
        - generic [ref=e14]:
          - textbox "Mot de passe" [ref=e15]: Password123!
          - button "Show password" [ref=e16]:
            - img [ref=e17]
      - alert [ref=e20]: Failed to fetch
      - button "Se connecter" [ref=e21]
    - generic [ref=e23]:
      - link "Mot de passe oublié ?" [ref=e24] [cursor=pointer]:
        - /url: /auth/forgot-password
      - generic [ref=e25]: •
      - generic [ref=e26]:
        - text: Pas de compte ?
        - link "S'inscrire" [ref=e27] [cursor=pointer]:
          - /url: /auth/register
  - button "Open Next.js Dev Tools" [ref=e33] [cursor=pointer]:
    - img [ref=e34] [cursor=pointer]
  - alert [ref=e37]
```