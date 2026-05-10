from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.socialaccount.models import SocialAccount
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

User = get_user_model()


class SocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Custom social account adapter for ElimuHub
    """

    def pre_social_login(self, request, sociallogin):
        """
        Handle social login logic before authentication
        """
        # Check if user already exists with this email
        email = sociallogin.user.email
        if email:
            try:
                existing_user = User.objects.get(email=email)
                # If user exists but not linked to this social account
                if not SocialAccount.objects.filter(
                    user=existing_user, provider=sociallogin.account.provider
                ).exists():
                    # Link the social account to existing user
                    sociallogin.connect(request, existing_user)
                    return
            except User.DoesNotExist:
                pass

        # Continue with default behavior
        return super().pre_social_login(request, sociallogin)

    def save_user(self, request, sociallogin, form=None):
        """
        Save user during social login
        """
        user = super().save_user(request, sociallogin, form)

        # Set user as email verified since social providers verify emails
        user.is_email_verified = True
        user.save()

        # Set default role if not set
        if not hasattr(user, "role") or not user.role:
            from accounts.models import Role

            try:
                default_role = Role.objects.get(name="STUDENT")
                user.role = default_role
                user.save()
            except Role.DoesNotExist:
                pass

        return user

    def populate_user(self, request, sociallogin, data):
        """
        Populate user data from social provider
        """
        user = super().populate_user(request, sociallogin, data)

        # Extract additional data from social providers
        extra_data = sociallogin.account.extra_data

        if sociallogin.account.provider == "google":
            # Google provides profile picture
            if "picture" in extra_data:
                user.profile_picture_url = extra_data["picture"]

        elif sociallogin.account.provider == "microsoft":
            # Microsoft provides additional profile info
            if "jobTitle" in extra_data:
                user.job_title = extra_data["jobTitle"]

        elif sociallogin.account.provider == "github":
            # GitHub provides username and bio
            if "login" in extra_data:
                user.github_username = extra_data["login"]
            if "bio" in extra_data:
                user.bio = extra_data["bio"]

        return user

    def get_connect_redirect_url(self, request, socialaccount):
        """
        Redirect URL after connecting social account
        """
        return "/dashboard"

    def is_auto_signup_allowed(self, request, sociallogin):
        """
        Control automatic signup behavior
        """
        # Allow auto signup for social logins
        return True
