detailDataset<%@ page language="java" contentType="text/html; charset=UTF-8"
pageEncoding="UTF-8"%>
<%@ page import="javax.servlet.http.Cookie" %>
<%
	response.setHeader("Cache-Control", "no-cache");
	response.setHeader("Pragma", "no-cache");
	response.setDateHeader("Expires", -1);
%>
<%
		Cookie cookie = null;
		String sessionid = "";
		Cookie[] cookieArray = request.getCookies();
		if (cookieArray != null) {
			for (int i = 0; i < cookieArray.length; i++) {
				cookie = cookieArray[i];
				if ("JSESSIONID".equals(cookie.getName())) {
					sessionid = cookie.getValue();
					break;
				}
			}
		}
%>
{"sessionid":"<%=sessionid%>"}